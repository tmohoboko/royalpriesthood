import { z } from "zod";
import { rows, one, transaction } from "./db.js";
import {
  id,
  hash,
  fail,
  totals,
  requireStock,
  addressSchema,
  paymentTransition,
  canFulfil,
} from "./domain.js";
import { enqueue } from "./notifications.js";

export async function cart(db, cartId) {
  return rows(
    db,
    "SELECT v.*,p.name,p.image,p.active,c.quantity FROM cart_items c JOIN variants v ON v.id=c.variant_id JOIN products p ON p.id=v.product_id WHERE c.cart_id=$1 ORDER BY v.id",
    [cartId],
  );
}
export async function mergeCart(db, guestId, userId) {
  return transaction(db, async (tx) => {
    // Serialize concurrent logins for a customer, then lock source cart against a second merge.
    await tx.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [userId]);
    let target = await one(tx, "SELECT * FROM carts WHERE user_id=$1", [
      userId,
    ]);
    if (!target) {
      target = { id: id() };
      await tx.query("INSERT INTO carts(id,user_id) VALUES($1,$2)", [
        target.id,
        userId,
      ]);
    }
    const guest = await one(
      tx,
      "SELECT * FROM carts WHERE id=$1 AND user_id IS NULL FOR UPDATE",
      [guestId],
    );
    if (guest && guest.id !== target.id) {
      for (const item of await rows(
        tx,
        "SELECT * FROM cart_items WHERE cart_id=$1",
        [guest.id],
      ))
        await tx.query(
          "INSERT INTO cart_items(cart_id,variant_id,quantity) VALUES($1,$2,$3) ON CONFLICT(cart_id,variant_id) DO UPDATE SET quantity=LEAST(99,cart_items.quantity+excluded.quantity)",
          [target.id, item.variant_id, item.quantity],
        );
      await tx.query("DELETE FROM wishlist_items g USING wishlist_items t WHERE g.cart_id=$1 AND t.cart_id=$2 AND g.product_id=t.product_id AND g.variant_id=t.variant_id",[guest.id,target.id]);
      await tx.query("UPDATE wishlist_items SET cart_id=$1,updated_at=now() WHERE cart_id=$2",[target.id,guest.id]);
      await tx.query("DELETE FROM carts WHERE id=$1", [guest.id]);
    }
    return target.id;
  });
}
export async function quote(db, cartId, shippingId, code = "") {
  const items = await cart(db, cartId);
  requireStock(items);
  const shipping = await one(
    db,
    "SELECT * FROM shipping_options WHERE id=$1 AND active=true",
    [shippingId],
  );
  if (!shipping)
    fail(400, "INVALID_SHIPPING", "Select an available delivery option");
  const promo = code
    ? await one(
        db,
        "SELECT * FROM promotions WHERE code=$1 AND active=true AND expires_at>now()",
        [code.toUpperCase()],
      )
    : null;
  if (code && !promo)
    fail(400, "INVALID_PROMOTION", "Discount code is invalid or expired");
  return { ...totals(items, promo?.percent || 0, shipping.price), items };
}
const checkoutSchema = z.object({
  address: addressSchema,
  shippingId: z.string().min(1).max(100),
  code: z.string().max(40).default(""),
  idempotencyKey: z.string().min(16).max(100),
});
export async function checkout(db, user, cartId, body) {
  const input = checkoutSchema.parse(body);
  const fingerprint = hash(
    JSON.stringify({
      address: input.address,
      shippingId: input.shippingId,
      code: input.code.toUpperCase(),
    }),
  );
  return transaction(db, async (tx) => {
    await tx.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [user.id]);
    const existing = await one(
      tx,
      "SELECT * FROM orders WHERE user_id=$1 AND idempotency_key=$2",
      [user.id, input.idempotencyKey],
    );
    if (existing) {
      if (existing.request_hash !== fingerprint)
        fail(
          409,
          "IDEMPOTENCY_CONFLICT",
          "This checkout reference was used with different delivery details",
        );
      return existing;
    }
    await tx.query("SELECT id FROM carts WHERE id=$1 FOR UPDATE", [cartId]);
    const pending = await one(
      tx,
      "SELECT id FROM orders WHERE user_id=$1 AND status='pending'",
      [user.id],
    );
    if (pending)
      fail(
        409,
        "PENDING_ORDER",
        `Complete or cancel pending order ${pending.id} before creating another`,
      );
    const selected = await cart(tx, cartId);
    // Consistent variant lock order prevents overselling and lock inversion between checkouts.
    for (const item of selected)
      await tx.query("SELECT id FROM variants WHERE id=$1 FOR UPDATE", [
        item.id,
      ]);
    const q = await quote(tx, cartId, input.shippingId, input.code);
    const orderId = id();
    const order = await one(
      tx,
      "INSERT INTO orders(id,user_id,idempotency_key,request_hash,subtotal,discount,shipping,total,address) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
      [
        orderId,
        user.id,
        input.idempotencyKey,
        fingerprint,
        q.subtotal,
        q.discount,
        q.shipping,
        q.total,
        JSON.stringify(input.address),
      ],
    );
    for (const item of q.items) {
      const updated = await one(
        tx,
        "UPDATE variants SET stock=stock-$1 WHERE id=$2 AND stock>=$1 RETURNING id",
        [item.quantity, item.id],
      );
      if (!updated)
        fail(409, "OUT_OF_STOCK", "Inventory changed; please review your cart");
      await tx.query(
        "INSERT INTO order_items(order_id,variant_id,name,size,colour,quantity,unit_price) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          orderId,
          item.id,
          item.name,
          item.size,
          item.colour,
          item.quantity,
          item.price,
        ],
      );
    }
    await tx.query("INSERT INTO payments(id,order_id) VALUES($1,$2)", [
      id(),
      orderId,
    ]);
    await tx.query(
      "INSERT INTO addresses(id,user_id,name,phone,line1,city,province,postal_code,country) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [
        id(),
        user.id,
        ...[
          "name",
          "phone",
          "line1",
          "city",
          "province",
          "postal_code",
          "country",
        ].map((k) => input.address[k]),
      ],
    );
    await tx.query("DELETE FROM cart_items WHERE cart_id=$1", [cartId]);
    return order;
  });
}
export async function cancelOrder(db, userId, orderId) {
  return transaction(db, async (tx) => {
    const order = await one(
      tx,
      "SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE",
      [orderId, userId],
    );
    if (!order) fail(404, "NOT_FOUND", "Order not found");
    if (order.status === "cancelled") return order;
    if (order.status !== "pending")
      fail(409, "INVALID_TRANSITION", "Only pending orders can be cancelled");
    // Once a hosted payment is issued it can arrive late; do not release reserved inventory automatically.
    const payment = await one(tx, "SELECT * FROM payments WHERE order_id=$1", [
      orderId,
    ]);
    if (payment.initiated_at && payment.status === "pending")
      fail(
        409,
        "RECONCILIATION_REQUIRED",
        "Gateway transaction requires reconciliation",
      );
    for (const item of await rows(
      tx,
      "SELECT * FROM order_items WHERE order_id=$1 ORDER BY variant_id",
      [orderId],
    ))
      await tx.query("UPDATE variants SET stock=stock+$1 WHERE id=$2", [
        item.quantity,
        item.variant_id,
      ]);
    await tx.query(
      "UPDATE payments SET status='cancelled',updated_at=now() WHERE order_id=$1",
      [orderId],
    );
    return one(
      tx,
      "UPDATE orders SET status='cancelled' WHERE id=$1 RETURNING *",
      [orderId],
    );
  });
}
export async function applyNotification(db, data) {
  if (
    !/^\d+\.\d{2}$/.test(data.amount_gross || "") ||
    !data.pf_payment_id ||
    data.pf_payment_id.length > 100
  )
    fail(400, "BAD_PAYMENT", "Invalid gateway payment data");
  if (
    !["COMPLETE", "FAILED", "CANCELLED", "PENDING"].includes(
      data.payment_status,
    )
  )
    fail(400, "BAD_STATUS", "Unsupported payment status");
  return transaction(db, async (tx) => {
    const lookup = await one(tx, "SELECT order_id FROM payments WHERE id=$1", [
      data.m_payment_id,
    ]);
    if (!lookup) fail(404, "NOT_FOUND", "Payment not found");
    const order = await one(tx, "SELECT * FROM orders WHERE id=$1 FOR UPDATE", [
      lookup.order_id,
    ]);
    const payment = await one(
      tx,
      "SELECT * FROM payments WHERE id=$1 FOR UPDATE",
      [data.m_payment_id],
    );
    if (Math.round(Number(data.amount_gross) * 100) !== order.total)
      fail(400, "AMOUNT_MISMATCH", "Payment amount does not match order");
    if (payment.provider_id && payment.provider_id !== data.pf_payment_id)
      fail(
        409,
        "TRANSACTION_CONFLICT",
        "Payment reference already associated with another transaction",
      );
    const eventKey = hash(
      `${payment.id}:${data.pf_payment_id}:${data.payment_status}`,
    );
    if (
      await one(tx, "SELECT event_key FROM payment_events WHERE event_key=$1", [
        eventKey,
      ])
    )
      return { duplicate: true };
    if (order.status === "cancelled" && data.payment_status === "COMPLETE")
      fail(
        409,
        "RECONCILIATION_REQUIRED",
        "Payment arrived after cancellation; manual reconciliation required",
      );
    const next = paymentTransition(payment.status, data.payment_status);
    await tx.query(
      "INSERT INTO payment_events(event_key,payment_id,status) VALUES($1,$2,$3)",
      [eventKey, payment.id, data.payment_status],
    );
    await tx.query(
      "UPDATE payments SET status=$1,provider_id=$2,updated_at=now() WHERE id=$3",
      [next, data.pf_payment_id, payment.id],
    );
    if (next === "paid" && order.status === "pending") {
      await tx.query("UPDATE orders SET status='paid' WHERE id=$1", [order.id]);
      await enqueue(tx, order.user_id, "receipt", order.id);
    } else if (next === "failed")
      await enqueue(tx, order.user_id, "payment_failed", order.id);
    return { duplicate: false, status: next };
  });
}
export async function fulfil(db, orderId, input) {
  return transaction(db, async (tx) => {
    const data = z
      .object({
        status: z.enum(["dispatched", "delivered"]),
        tracking: z.string().trim().min(3).max(200),
      })
      .parse(input);
    const order = await one(tx, "SELECT * FROM orders WHERE id=$1 FOR UPDATE", [
      orderId,
    ]);
    if (!order) fail(404, "NOT_FOUND", "Order not found");
    if (!canFulfil(order.status, data.status))
      fail(
        409,
        "INVALID_TRANSITION",
        "Order is not eligible for this fulfilment update",
      );
    await tx.query("UPDATE orders SET status=$1,tracking=$2 WHERE id=$3", [
      data.status,
      data.tracking,
      orderId,
    ]);
    await enqueue(tx, order.user_id, `status_${data.status}`, orderId);
    return { ok: true };
  });
}
