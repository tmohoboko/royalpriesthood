import { createHash, timingSafeEqual } from "node:crypto";
import { resolve4 } from "node:dns/promises";
import { fail } from "./domain.js";
const encodeRaw = (v) =>
  encodeURIComponent(String(v))
    .replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    )
    .replace(/%20/g, "+");
export const encode = (v) => encodeRaw(String(v).trim());
export const paramString = (data) =>
  Object.entries(data)
    .filter(([k, v]) => k !== "signature" && v !== "" && v != null)
    .map(([k, v]) => `${k}=${encode(v)}`)
    .join("&");
export const signature = (data, passphrase) =>
  createHash("md5")
    .update(
      paramString(data) +
        (passphrase ? `&passphrase=${encode(passphrase)}` : ""),
    )
    .digest("hex");
export function paymentConfig(env = process.env) {
  if (env.PAYFAST_MODE !== "sandbox")
    fail(
      503,
      "PAYMENTS_DISABLED",
      "Only configured PayFast sandbox payments are enabled for this release",
    );
  const localTest =
    env.NODE_ENV === "test" &&
    !env.VERCEL &&
    /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(env.APP_ORIGIN || "");
  if (
    !env.PAYFAST_MERCHANT_ID ||
    !env.PAYFAST_MERCHANT_KEY ||
    !env.PAYFAST_PASSPHRASE ||
    (!env.APP_ORIGIN?.startsWith("https://") && !localTest)
  )
    fail(
      503,
      "PAYMENTS_DISABLED",
      "PayFast sandbox credentials and HTTPS APP_ORIGIN are required",
    );
  return {
    host: "sandbox.payfast.co.za",
    merchantId: env.PAYFAST_MERCHANT_ID,
    merchantKey: env.PAYFAST_MERCHANT_KEY,
    passphrase: env.PAYFAST_PASSPHRASE,
    origin: new URL(env.APP_ORIGIN).origin,
  };
}
export function hostedPayment(order, payment, user, env = process.env) {
  const config = paymentConfig(env);
  const fields = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: `${config.origin}/shop/orders/${order.id}?payment=returned`,
    cancel_url: `${config.origin}/shop/orders/${order.id}?payment=cancelled`,
    notify_url: `${config.origin}/api/commerce/payfast/notify`,
    email_address: user.email,
    m_payment_id: payment.id,
    amount: (order.total / 100).toFixed(2),
    item_name: `Royal Priesthood ${order.id.slice(0, 12)}`,
  };
  return {
    action: `https://${config.host}/eng/process`,
    fields: { ...fields, signature: signature(fields, config.passphrase) },
    mode: "sandbox",
  };
}
export const notificationString = (data) =>
  Object.entries(data)
    .filter(([k]) => k !== "signature")
    .map(([k, v]) => `${k}=${encodeRaw(v)}`)
    .join("&");
export const notificationSignature = (data, passphrase) =>
  createHash("md5")
    .update(notificationString(data) + `&passphrase=${encodeRaw(passphrase)}`)
    .digest("hex");
export async function verifyNotification(
  data,
  sourceIp,
  env = process.env,
  fetcher = fetch,
  resolver = resolve4,
) {
  const config = paymentConfig(env);
  const expected = notificationSignature(data, config.passphrase);
  if (
    !/^[a-f0-9]{32}$/i.test(data.signature || "") ||
    !timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(data.signature.toLowerCase()),
    )
  )
    fail(400, "BAD_SIGNATURE", "Invalid payment signature");
  if (data.merchant_id !== config.merchantId)
    fail(400, "BAD_MERCHANT", "Invalid merchant");
  const hosts = [
    "www.payfast.co.za",
    "sandbox.payfast.co.za",
    "w1w.payfast.co.za",
    "w2w.payfast.co.za",
  ];
  const addresses = (
    await Promise.allSettled(hosts.map((h) => resolver(h)))
  ).flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (!addresses.includes(sourceIp?.replace(/^::ffff:/, "")))
    fail(400, "BAD_SOURCE", "Payment source could not be authenticated");
  const response = await fetcher(`https://${config.host}/eng/query/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: notificationString(data),
    signal: AbortSignal.timeout(10000),
    redirect: "error",
  });
  if (!response.ok || (await response.text()).trim() !== "VALID")
    fail(400, "UNVERIFIED_PAYMENT", "Gateway did not verify this transaction");
  return true;
}
