import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { createHandler } from "../../server/handler.js";
import { seedFixtures, fixtureEnv } from "../../server/fixtures.js";
import { one, rows } from "../../server/db.js";
import {
  notificationSignature,
  verifyNotification,
} from "../../server/payfast.js";
let db, handle;
const emails = [];
const address = {
  name: "Test Customer",
  phone: "0821234567",
  line1: "10 Test Street",
  city: "Johannesburg",
  province: "Gauteng",
  postal_code: "2000",
  country: "ZA",
};
function client() {
  let cookies = {};
  return async (path, method = "GET", body, options = {}) => {
    const request = new Request(
      `${fixtureEnv.APP_ORIGIN}/api/commerce${path}`,
      {
        method,
        headers: {
          origin: fixtureEnv.APP_ORIGIN,
          cookie: Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join("; "),
          "content-type": "application/json",
          ...options.headers,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    const response = await handle(request, "127.0.0.1");
    for (const c of response.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const [k, v] = pair.split("=");
      cookies[k] = v;
    }
    return { status: response.status, data: await response.json() };
  };
}
async function customer(suffix) {
  const c = client();
  const r = await c("/auth/register", "POST", {
    email: `${suffix}@example.invalid`,
    password: "Long-test-password123",
    name: "Test Customer",
  });
  assert.equal(r.status, 200);
  return c;
}
async function pending(c, key = "idempotency-key-for-test") {
  await c("/cart", "GET");
  assert.equal(
    (await c("/cart", "PUT", { variantId: "test-black-m", quantity: 2 }))
      .status,
    200,
  );
  return c("/checkout", "POST", {
    address,
    shippingId: "standard",
    code: "TEST10",
    idempotencyKey: key,
  });
}
async function notify(payment, status = "COMPLETE", overrides = {}) {
  const data = {
    merchant_id: fixtureEnv.PAYFAST_MERCHANT_ID,
    m_payment_id: payment.id,
    pf_payment_id: `gateway-${payment.id}`,
    amount_gross: "705.00",
    payment_status: status,
    ...overrides,
  };
  data.signature = notificationSignature(data, fixtureEnv.PAYFAST_PASSPHRASE);
  const r = await handle(
    new Request(`${fixtureEnv.APP_ORIGIN}/api/commerce/payfast/notify`, {
      method: "POST",
      body: new URLSearchParams(data),
    }),
    "127.0.0.1",
  );
  return { status: r.status, data: await r.json() };
}
before(async () => {
  db = new PGlite();
  await seedFixtures(db);
  handle = createHandler({
    db,
    env: fixtureEnv,
    verify: (data, sourceIp, env) =>
      verifyNotification(
        data,
        sourceIp,
        env,
        async () => new Response("VALID"),
        async () => [sourceIp],
      ),
    fetcher: async (url, opts) => {
      emails.push({
        url,
        body: JSON.parse(opts.body),
        key: opts.headers["Idempotency-Key"],
      });
      return new Response("{}", { status: 200 });
    },
  });
});
after(async () => db.close());
test("public catalogue and inventory; anonymous checkout/admin rejected", async () => {
  const c = client();
  assert.equal((await c("/products")).data.products.length, 2);
  assert.equal((await c("/orders")).status, 401);
  assert.equal((await c("/admin/products")).status, 401);
  assert.equal((await c("/checkout", "POST", {})).status, 401);
});
test("cross-origin mutations and invalid inputs rejected", async () => {
  const c = client();
  assert.equal(
    (
      await c(
        "/cart",
        "PUT",
        { variantId: "test-black-m", quantity: 1 },
        { headers: { origin: "https://attacker.invalid" } },
      )
    ).status,
    403,
  );
  assert.equal(
    (await c("/auth/register", "POST", { email: "bad", password: "short" }))
      .status,
    400,
  );
  assert.equal(
    (await c("/cart", "PUT", { variantId: "test-black-m", quantity: -1 }))
      .status,
    400,
  );
});
test("persistent guest cart merges exactly once across registration and login", async () => {
  const c = client();
  await c("/cart");
  await c("/cart", "PUT", { variantId: "test-black-m", quantity: 2 });
  await c("/auth/register", "POST", {
    email: "merge@example.invalid",
    password: "Long-test-password123",
    name: "Merge Customer",
  });
  assert.equal((await c("/cart")).data.items[0].quantity, 2);
  await c("/auth/logout", "POST", {});
  await c("/cart");
  await c("/cart", "PUT", { variantId: "test-black-l", quantity: 1 });
  await c("/auth/login", "POST", {
    email: "merge@example.invalid",
    password: "Long-test-password123",
  });
  assert.equal((await c("/cart")).data.items.length, 2);
  assert.equal((await c("/admin/orders")).status, 403);
});
test("checkout validates stock and recalculates prices ignoring browser totals", async () => {
  const c = await customer("pricing");
  assert.equal(
    (await c("/cart", "PUT", { variantId: "test-white-m", quantity: 1 }))
      .status,
    409,
  );
  const before = (
    await one(db, "SELECT stock FROM variants WHERE id='test-black-m'")
  ).stock;
  const result = await pending(c);
  assert.equal(result.status, 201);
  assert.equal(result.data.order.total, 70500);
  assert.equal(result.data.order.status, "pending");
  assert.equal(
    (await one(db, "SELECT stock FROM variants WHERE id='test-black-m'")).stock,
    before - 2,
  );
  assert.equal((await c("/cart")).data.items.length, 0);
  assert.equal(
    (await c("/addresses", "POST", { ...address, postal_code: "invalid" }))
      .status,
    400,
  );
});
test("idempotency prevents duplicate orders and stock reservations", async () => {
  const c = await customer("retry");
  const first = await pending(c, "repeat-order-key-1234");
  const second = await c("/checkout", "POST", {
    address,
    shippingId: "standard",
    code: "TEST10",
    idempotencyKey: "repeat-order-key-1234",
  });
  assert.equal(second.data.order.id, first.data.order.id);
  assert.equal(
    (
      await c("/checkout", "POST", {
        address: { ...address, city: "Cape Town" },
        shippingId: "standard",
        code: "TEST10",
        idempotencyKey: "repeat-order-key-1234",
      })
    ).status,
    409,
  );
  assert.equal((await c("/orders")).data.orders.length, 1);
});
test("only order owner can see or initiate sandbox payment; redirect is not payment", async () => {
  const owner = await customer("owner"),
    other = await customer("other");
  const { data } = await pending(owner);
  assert.equal((await other(`/orders/${data.order.id}`)).status, 404);
  const pay = await owner(`/orders/${data.order.id}/pay`, "POST", {});
  assert.equal(pay.status, 200);
  assert.equal(pay.data.fields.amount, "705.00");
  assert.equal(pay.data.action, "https://sandbox.payfast.co.za/eng/process");
  assert.equal(
    (await owner(`/orders/${data.order.id}?payment=success`)).data.payment
      .status,
    "pending",
  );
});
test("verified callback marks paid, emits one receipt, rejects amount mismatch and replay", async () => {
  const c = await customer("paid");
  const { data } = await pending(c);
  const payment = await one(db, "SELECT * FROM payments WHERE order_id=$1", [
    data.order.id,
  ]);
  assert.equal(
    (await notify(payment, "COMPLETE", { amount_gross: "1.00" })).status,
    400,
  );
  assert.equal((await notify(payment)).status, 200);
  assert.equal((await notify(payment)).data.duplicate, true);
  const detail = (await c(`/orders/${data.order.id}`)).data;
  assert.equal(detail.order.status, "paid");
  assert.equal(detail.payment.status, "paid");
  assert.equal(
    (
      await rows(
        db,
        "SELECT * FROM notifications WHERE order_id=$1 AND kind='receipt'",
        [data.order.id],
      )
    ).length,
    1,
  );
  assert.equal(detail.notifications[0].status, "sent");
  assert.equal(
    emails.filter((e) => e.body.text.includes(data.order.id)).length,
    1,
  );
  assert.equal((await notify(payment, "FAILED")).status, 200);
  assert.equal((await c(`/orders/${data.order.id}`)).data.order.status, "paid");
});
test("failed and cancelled callbacks never issue receipt; cancel releases stock once", async () => {
  const c = await customer("failed");
  const { data } = await pending(c);
  const payment = await one(db, "SELECT * FROM payments WHERE order_id=$1", [
    data.order.id,
  ]);
  await notify(payment, "FAILED");
  assert.equal(
    (
      await rows(
        db,
        "SELECT * FROM notifications WHERE order_id=$1 AND kind='receipt'",
        [data.order.id],
      )
    ).length,
    0,
  );
  assert.equal(
    (await c(`/orders/${data.order.id}/pay`, "POST", {})).status,
    409,
  );
  const b = await customer("cancel");
  const o = (await pending(b)).data.order;
  const stock = (
    await one(db, "SELECT stock FROM variants WHERE id='test-black-m'")
  ).stock;
  await b(`/orders/${o.id}/cancel`, "POST", {});
  await b(`/orders/${o.id}/cancel`, "POST", {});
  assert.equal(
    (await one(db, "SELECT stock FROM variants WHERE id='test-black-m'")).stock,
    stock + 2,
  );
  const p = await one(db, "SELECT * FROM payments WHERE order_id=$1", [o.id]);
  assert.equal((await notify(p)).status, 409);
});
test("administrator manages products and fulfilment; cannot dispatch unpaid orders", async () => {
  const a = client();
  assert.equal(
    (
      await a("/auth/login", "POST", {
        email: "admin@example.invalid",
        password: "Test-admin-password-123",
      })
    ).status,
    200,
  );
  assert.equal((await a("/admin/products")).status, 200);
  assert.equal(
    (
      await a("/admin/products", "PUT", {
        id: "test-new",
        name: "Test new product",
        image: "/images/catalog/09_Tshirt_Front_Black.png",
        category: "T-Shirts",
        active: false,
      })
    ).status,
    200,
  );
  const c = await customer("fulfil");
  const o = (await pending(c)).data.order;
  assert.equal(
    (
      await a(`/admin/orders/${o.id}`, "PATCH", {
        status: "dispatched",
        tracking: "TEST-123",
      })
    ).status,
    409,
  );
  await notify(
    await one(db, "SELECT * FROM payments WHERE order_id=$1", [o.id]),
  );
  assert.equal(
    (
      await a(`/admin/orders/${o.id}`, "PATCH", {
        status: "dispatched",
        tracking: "TEST-123",
      })
    ).status,
    200,
  );
  assert.equal((await c(`/orders/${o.id}`)).data.order.tracking, "TEST-123");
});
test("inventory changes roll checkout back without partial order or stock mutation", async () => {
  const c = await customer("stock-conflict");
  await c("/cart");
  await c("/cart", "PUT", { variantId: "test-black-l", quantity: 2 });
  await db.query("UPDATE variants SET stock=1 WHERE id='test-black-l'");
  const result = await c("/checkout", "POST", {
    address,
    shippingId: "standard",
    idempotencyKey: "stock-conflict-key-123",
  });
  assert.equal(result.status, 409);
  assert.equal((await c("/orders")).data.orders.length, 0);
  assert.equal((await c("/cart")).data.items[0].quantity, 2);
  assert.equal(
    (await one(db, "SELECT stock FROM variants WHERE id='test-black-l'")).stock,
    1,
  );
  await db.query("UPDATE variants SET stock=100 WHERE id='test-black-l'");
});
test("invalid credentials, origin, forged callback and duplicate fields fail safely", async () => {
  const c = client();
  assert.equal(
    (
      await c("/auth/login", "POST", {
        email: "admin@example.invalid",
        password: "incorrect-password-123",
        name: "",
      })
    ).status,
    401,
  );
  const data = {
    merchant_id: fixtureEnv.PAYFAST_MERCHANT_ID,
    signature: "0".repeat(32),
  };
  const forged = await handle(
    new Request(`${fixtureEnv.APP_ORIGIN}/api/commerce/payfast/notify`, {
      method: "POST",
      body: new URLSearchParams(data),
    }),
    "127.0.0.1",
  );
  assert.equal(forged.status, 400);
  const duplicate = await handle(
    new Request(`${fixtureEnv.APP_ORIGIN}/api/commerce/payfast/notify`, {
      method: "POST",
      body: "amount_gross=1.00&amount_gross=100.00",
    }),
    "127.0.0.1",
  );
  assert.equal(duplicate.status, 400);
});
test("verified cancellation preserves unpaid status and permits safe inventory release", async () => {
  const c = await customer("gateway-cancel");
  const o = (await pending(c)).data.order;
  await c(`/orders/${o.id}/pay`, "POST", {});
  assert.equal((await c(`/orders/${o.id}/cancel`, "POST", {})).status, 409);
  const p = await one(db, "SELECT * FROM payments WHERE order_id=$1", [o.id]);
  assert.equal((await notify(p, "CANCELLED")).status, 200);
  assert.equal((await notify(p, "CANCELLED")).data.duplicate, true);
  assert.equal((await c(`/orders/${o.id}/cancel`, "POST", {})).status, 200);
  assert.equal(
    (
      await rows(
        db,
        "SELECT * FROM notifications WHERE order_id=$1 AND kind='receipt'",
        [o.id],
      )
    ).length,
    0,
  );
});
test("failed email jobs retry with a stable idempotency key and do not regress payments", async () => {
  const { deliverNotifications } =
    await import("../../server/notifications.js");
  const c = await customer("email-retry");
  const o = (await pending(c)).data.order;
  // Queue a receipt via the real payment mutation without automatically draining it.
  const { applyNotification } = await import("../../server/service.js");
  const p = await one(db, "SELECT * FROM payments WHERE order_id=$1", [o.id]);
  await applyNotification(db, {
    m_payment_id: p.id,
    pf_payment_id: `gateway-${p.id}`,
    amount_gross: "705.00",
    payment_status: "COMPLETE",
  });
  const keys = [];
  await deliverNotifications(db, fixtureEnv, async (_url, opts) => {
    keys.push(opts.headers["Idempotency-Key"]);
    return new Response("{}", { status: 503 });
  });
  let n = await one(
    db,
    "SELECT * FROM notifications WHERE order_id=$1 AND kind='receipt'",
    [o.id],
  );
  assert.equal(n.status, "failed");
  assert.equal((await c(`/orders/${o.id}`)).data.order.status, "paid");
  await db.query("UPDATE notifications SET next_attempt_at=now() WHERE id=$1", [
    n.id,
  ]);
  await deliverNotifications(db, fixtureEnv, async (_url, opts) => {
    keys.push(opts.headers["Idempotency-Key"]);
    return new Response("{}", { status: 200 });
  });
  n = await one(db, "SELECT * FROM notifications WHERE id=$1", [n.id]);
  assert.equal(n.status, "sent");
  assert.equal(keys.filter((k) => k === n.id).length, 2);
});
test("SQL data and hashed sessions survive database close and reopen", async () => {
  const { mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const directory = await mkdtemp(join(tmpdir(), "rp-commerce-persistence-"));
  const first = new PGlite(directory);
  await seedFixtures(first);
  const h = createHandler({ db: first, env: fixtureEnv });
  const registration = await h(
    new Request(`${fixtureEnv.APP_ORIGIN}/api/commerce/auth/register`, {
      method: "POST",
      headers: {
        origin: fixtureEnv.APP_ORIGIN,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "persist@example.invalid",
        password: "Persistent-password-123",
        name: "Persistent Customer",
      }),
    }),
    "127.0.0.1",
  );
  const session = registration.headers
    .getSetCookie()
    .find((c) => c.startsWith("rp_session="))
    .split(";")[0];
  await first.close();
  const second = new PGlite(directory);
  try {
    const reopened = createHandler({ db: second, env: fixtureEnv });
    const response = await reopened(
      new Request(`${fixtureEnv.APP_ORIGIN}/api/commerce/me`, {
        headers: { cookie: session },
      }),
    );
    assert.equal((await response.json()).user.email, "persist@example.invalid");
  } finally {
    await second.close();
  }
});
test("production Node adapter preserves rewritten paths, raw bodies and session cookies", async () => {
  const { createServer } = await import("node:http");
  const { createNodeAdapter } = await import("../../server/node-adapter.js");
  const server = createServer(createNodeAdapter(handle, fixtureEnv));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const catalogue = await fetch(`${base}/api/commerce?commercePath=products`);
    assert.equal(catalogue.status, 200);
    assert.equal((await catalogue.json()).products.length, 2);
    const registration = await fetch(
      `${base}/api/commerce?commercePath=auth/register`,
      {
        method: "POST",
        headers: {
          origin: fixtureEnv.APP_ORIGIN,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "node-adapter@example.invalid",
          name: "Adapter Customer",
          password: "Adapter-password-123",
        }),
      },
    );
    assert.equal(registration.status, 200);
    assert.equal(registration.headers.getSetCookie().length, 2);
    const cookie = registration.headers
      .getSetCookie()
      .find((c) => c.startsWith("rp_session="))
      .split(";")[0];
    const profile = await fetch(`${base}/api/commerce?commercePath=me`, {
      headers: { cookie },
    });
    assert.equal(
      (await profile.json()).user.email,
      "node-adapter@example.invalid",
    );
    const oversized = await fetch(
      `${base}/api/commerce?commercePath=auth/login`,
      {
        method: "POST",
        headers: {
          origin: fixtureEnv.APP_ORIGIN,
          "content-type": "application/json",
        },
        body: "x".repeat(65537),
      },
    );
    assert.equal(oversized.status, 413);
    assert.equal((await oversized.json()).error.code, "BODY_TOO_LARGE");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
