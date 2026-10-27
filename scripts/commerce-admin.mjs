import { database, one } from "../server/db.js";
// A database operator explicitly promotes an already registered account. There is no HTTP role setter.
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!email || !email.includes("@"))
  throw Error("Set ADMIN_EMAIL to an existing registered account email");
const db = await database();
try {
  const account = await one(
    db,
    "UPDATE users SET role='admin' WHERE email=$1 RETURNING id",
    [email],
  );
  if (!account) throw Error("Register the intended administrator first");
  console.log("Existing account promoted to administrator.");
} finally {
  await db.end();
}
