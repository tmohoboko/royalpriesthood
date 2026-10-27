import { readFile } from "node:fs/promises";
import { database, transaction } from "../server/db.js";
import { products } from "../src/data.js";
const db = await database();
await transaction(db, async (tx) => {
  await tx.query(
    await readFile(
      new URL("../migrations/001-commerce.sql", import.meta.url),
      "utf8",
    ),
  );
  await tx.query(await readFile(new URL("../migrations/002-wishlist.sql", import.meta.url), "utf8"));
  for (const p of products)
    await tx.query(
      "INSERT INTO products(id,name,image,category,description) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
      [
        p.id,
        p.name,
        p.image,
        p.department,
        "Catalogue reference. Confirm saleable contents, price and inventory before activation.",
      ],
    );
});
await db.end();
console.log(
  "Additive commerce migration complete. Catalogue remains inactive until configured by an administrator.",
);
