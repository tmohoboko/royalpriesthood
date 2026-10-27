import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
const scrypt = promisify(scryptCallback);
export const id = () => randomBytes(24).toString("hex");
export const hash = (v) => createHash("sha256").update(v).digest("hex");
export const fail = (status, code, message) => {
  throw Object.assign(new Error(message), { status, code });
};
export const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9 ()-]{9,20}$/),
  line1: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(100),
  province: z.enum([
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
    "Western Cape",
  ]),
  postal_code: z.string().regex(/^\d{4}$/),
  country: z.literal("ZA").default("ZA"),
});
export const credentialsSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(128),
  name: z.string().trim().min(2).max(100).optional(),
});
export async function passwordHash(password) {
  const salt = id();
  return `${salt}:${(await scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 })).toString("hex")}`;
}
export async function passwordValid(password, stored) {
  const [salt, encoded] = stored.split(":");
  const computed = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 3,
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(computed, Buffer.from(encoded, "hex"));
}
export function totals(items, percent = 0, shipping = 0) {
  if (!items.length) fail(400, "EMPTY_CART", "Your cart is empty");
  const subtotal = items.reduce((sum, i) => {
    if (
      !Number.isInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > 99 ||
      !Number.isInteger(i.price) ||
      i.price < 500
    )
      fail(400, "INVALID_CART", "Invalid cart quantity or price");
    return sum + i.price * i.quantity;
  }, 0);
  if (
    !Number.isInteger(percent) ||
    percent < 0 ||
    percent > 100 ||
    !Number.isInteger(shipping) ||
    shipping < 0
  )
    fail(400, "INVALID_TOTAL", "Invalid discount or shipping");
  const discount = Math.floor((subtotal * percent) / 100);
  const total = subtotal - discount + shipping;
  if (!Number.isSafeInteger(total) || total < 500 || total > 100000000)
    fail(400, "INVALID_TOTAL", "Order total must be between R5 and R1,000,000");
  return { subtotal, discount, shipping, total };
}
export function requireStock(items) {
  for (const i of items)
    if (!i.active || i.stock < i.quantity)
      fail(
        409,
        "OUT_OF_STOCK",
        `${i.name} (${i.size}) is unavailable in the requested quantity`,
      );
}
export function paymentTransition(current, event) {
  if (current === "paid" || current === "refunded") return current;
  return (
    { COMPLETE: "paid", FAILED: "failed", CANCELLED: "cancelled" }[event] ||
    current
  );
}
export function canFulfil(current, next) {
  return (
    { paid: ["dispatched"], dispatched: ["delivered"] }[current]?.includes(
      next,
    ) || false
  );
}
