import { test } from "node:test";
import assert from "node:assert/strict";
import {
  totals,
  requireStock,
  paymentTransition,
  canFulfil,
  passwordHash,
  passwordValid,
} from "../../server/domain.js";
import {
  signature,
  paramString,
  paymentConfig,
  verifyNotification,
} from "../../server/payfast.js";
test("server totals use integer cents and floor percentage discount", () =>
  assert.deepEqual(totals([{ price: 999, quantity: 3 }], 10, 7500), {
    subtotal: 2997,
    discount: 299,
    shipping: 7500,
    total: 10198,
  }));
test("reject empty carts, invalid quantities, prices and zero totals", () => {
  for (const items of [
    [],
    [{ price: 500, quantity: 0 }],
    [{ price: 500, quantity: 100 }],
    [{ price: NaN, quantity: 1 }],
  ])
    assert.throws(() => totals(items));
  assert.throws(() => totals([{ price: 500, quantity: 1 }], 100));
});
test("stock must be available and product active", () => {
  requireStock([{ active: true, stock: 2, quantity: 2 }]);
  assert.throws(() => requireStock([{ active: false, stock: 5, quantity: 1 }]));
  assert.throws(() => requireStock([{ active: true, stock: 0, quantity: 1 }]));
});
test("payment transitions cannot regress successful payment", () => {
  assert.equal(paymentTransition("pending", "COMPLETE"), "paid");
  assert.equal(paymentTransition("paid", "FAILED"), "paid");
  assert.equal(paymentTransition("refunded", "COMPLETE"), "refunded");
  assert.equal(paymentTransition("pending", "FAILED"), "failed");
  assert.equal(paymentTransition("failed", "COMPLETE"), "paid");
  assert.equal(paymentTransition("pending", "PENDING"), "pending");
});
test("fulfilment requires verified payment first", () => {
  assert.equal(canFulfil("pending", "dispatched"), false);
  assert.equal(canFulfil("paid", "dispatched"), true);
  assert.equal(canFulfil("dispatched", "delivered"), true);
  assert.equal(canFulfil("delivered", "paid"), false);
});
test("password hashes are salted and verify correctly", async () => {
  const h = await passwordHash("a-long-password");
  assert.notEqual(h, await passwordHash("a-long-password"));
  assert.equal(await passwordValid("a-long-password", h), true);
  assert.equal(await passwordValid("wrong", h), false);
});
test("PayFast canonical encoding uses PHP form encoding and excludes signature", () => {
  const data = {
    merchant_id: "10000100",
    item_name: "Test & Crown!",
    empty: "",
    signature: "ignored",
  };
  assert.equal(
    paramString(data),
    "merchant_id=10000100&item_name=Test+%26+Crown%21",
  );
  assert.equal(signature({ a: "b" }, ""), "7acaac15494e6820b1ed6d8b539af089");
});
test("live and unconfigured payments fail closed", () => {
  assert.throws(() => paymentConfig({ PAYFAST_MODE: "live" }));
  assert.throws(() => paymentConfig({ PAYFAST_MODE: "sandbox" }));
});
test("invalid callback signature rejected before network verification", async () => {
  await assert.rejects(
    () =>
      verifyNotification({ signature: "0".repeat(32) }, "127.0.0.1", {
        PAYFAST_MODE: "sandbox",
        PAYFAST_MERCHANT_ID: "id",
        PAYFAST_MERCHANT_KEY: "key",
        PAYFAST_PASSPHRASE: "phrase",
        APP_ORIGIN: "https://shop.test",
      }),
    /signature/,
  );
});
test("PayFast ITN retains empty fields and verifies source and server confirmation", async () => {
  const { notificationSignature, notificationString } =
    await import("../../server/payfast.js");
  const env = {
    PAYFAST_MODE: "sandbox",
    PAYFAST_MERCHANT_ID: "merchant",
    PAYFAST_MERCHANT_KEY: "key",
    PAYFAST_PASSPHRASE: "phrase",
    APP_ORIGIN: "https://shop.test",
  };
  const data = {
    merchant_id: "merchant",
    name_first: "",
    item_name: " Crown ",
    amount_gross: "350.00",
  };
  data.signature = notificationSignature(data, "phrase");
  assert.match(notificationString(data), /name_first=&item_name=\+Crown\+/);
  let called = false;
  const server = async (url, opts) => {
    called = true;
    assert.equal(url, "https://sandbox.payfast.co.za/eng/query/validate");
    assert.equal(opts.body, notificationString(data));
    return new Response("VALID");
  };
  assert.equal(
    await verifyNotification(data, "192.0.2.10", env, server, async () => [
      "192.0.2.10",
    ]),
    true,
  );
  assert.equal(called, true);
  await assert.rejects(
    () =>
      verifyNotification(data, "192.0.2.11", env, server, async () => [
        "192.0.2.10",
      ]),
    /source/,
  );
  await assert.rejects(
    () =>
      verifyNotification(
        data,
        "192.0.2.10",
        env,
        async () => new Response("INVALID"),
        async () => ["192.0.2.10"],
      ),
    /verify/,
  );
});
