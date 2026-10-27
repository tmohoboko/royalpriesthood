import { id } from "./domain.js";
import { rows, one, transaction } from "./db.js";
export async function enqueue(db, userId, kind, orderId = null, payload = {}) {
  await db.query(
    "INSERT INTO notifications(id,dedupe_key,user_id,order_id,kind,payload) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(dedupe_key) DO NOTHING",
    [
      id(),
      `${kind}:${orderId || userId}`,
      userId,
      orderId,
      kind,
      JSON.stringify(payload),
    ],
  );
}
export async function template(db, n) {
  const user = await one(db, "SELECT name,email FROM users WHERE id=$1", [
    n.user_id,
  ]);
  if (n.kind === "welcome")
    return {
      to: user.email,
      subject: "Welcome to Royal Priesthood",
      text: `Welcome ${user.name}. Your Royal Priesthood customer account is ready.`,
    };
  const order = await one(db, "SELECT * FROM orders WHERE id=$1", [n.order_id]);
  const items = await rows(db, "SELECT * FROM order_items WHERE order_id=$1", [
    n.order_id,
  ]);
  const payment = await one(
    db,
    "SELECT provider_id,status FROM payments WHERE order_id=$1",
    [n.order_id],
  );
  const money = (v) => `R ${(v / 100).toFixed(2)}`;
  const receipt = `Order ${order.id}\n${items.map((i) => `${i.quantity} × ${i.name} / ${i.size} / ${i.colour}: ${money(i.unit_price * i.quantity)}`).join("\n")}\nSubtotal ${money(order.subtotal)}\nDiscount ${money(order.discount)}\nDelivery ${money(order.shipping)}\nTotal ${money(order.total)}\nPayment ${payment.status} / PayFast ${payment.provider_id || "pending"}\nOrder status ${order.status}\nTracking ${order.tracking || "Awaiting dispatch"}`;
  return {
    to: user.email,
    subject:
      n.kind === "receipt"
        ? "Royal Priesthood order confirmation and payment receipt"
        : n.kind === "payment_failed"
          ? "Royal Priesthood payment unsuccessful"
          : "Royal Priesthood delivery update",
    text: `Hello ${user.name},\n\n${receipt}`,
  };
}
export async function deliverNotifications(
  db,
  env = process.env,
  fetcher = fetch,
) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM)
    return { sent: 0, configured: false };
  // Row locks keep simultaneous workers from sending the same job. Provider idempotency covers retry after crash.
  return transaction(db, async (tx) => {
    const jobs = await rows(
      tx,
      "SELECT * FROM notifications WHERE status!='sent' AND attempts<8 AND next_attempt_at<=now() ORDER BY next_attempt_at LIMIT 10 FOR UPDATE SKIP LOCKED",
    );
    let sent = 0;
    for (const job of jobs) {
      try {
        const email = await template(tx, job);
        const response = await fetcher("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": job.id,
          },
          body: JSON.stringify({ from: env.EMAIL_FROM, ...email }),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw Error(`EMAIL_HTTP_${response.status}`);
        await tx.query(
          "UPDATE notifications SET status='sent',sent_at=now(),attempts=attempts+1,last_error=NULL WHERE id=$1",
          [job.id],
        );
        sent++;
      } catch {
        await tx.query(
          "UPDATE notifications SET status='failed',attempts=attempts+1,last_error='Delivery failed; inspect provider dashboard',next_attempt_at=now()+interval '15 minutes' WHERE id=$1",
          [job.id],
        );
      }
    }
    return { sent, configured: true };
  });
}
