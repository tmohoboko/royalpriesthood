// Local automated tests only. Never imported by the deployed function.
import { readFile } from "node:fs/promises";
import { passwordHash } from "./domain.js";
export const fixtureEnv = {
  NODE_ENV: "test",
  APP_ORIGIN: "http://127.0.0.1:4173",
  PAYFAST_MODE: "sandbox",
  PAYFAST_MERCHANT_ID: "test-merchant",
  PAYFAST_MERCHANT_KEY: "test-key",
  PAYFAST_PASSPHRASE: "test-passphrase",
  RESEND_API_KEY: "test-only-not-a-key",
  EMAIL_FROM: "test@example.invalid",
};
export async function seedFixtures(db) {
  await db.exec(
    await readFile(
      new URL("../migrations/001-commerce.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.query(
    "INSERT INTO products(id,name,image,category,active,description) VALUES('RP-T01','Black Signature Tee — Front','/images/catalog/09_Tshirt_Front_Black.png','T-Shirts',true,'AUTOMATED TEST FIXTURE: one tee only, not the complete styled look.'),('RP-T03','White Signature Tee — Front','/images/catalog/11_Tshirt_Front_White.png','T-Shirts',true,'AUTOMATED TEST FIXTURE') ON CONFLICT DO NOTHING",
  );
  await db.query(
    "INSERT INTO variants(id,product_id,size,colour,price,stock) VALUES('test-black-m','RP-T01','M','Black / Gold',35000,100),('test-black-l','RP-T01','L','Black / Gold',35000,100),('test-white-m','RP-T03','M','White / Black',35000,0) ON CONFLICT DO NOTHING",
  );
  await db.query(
    "INSERT INTO shipping_options VALUES('standard','Test standard delivery',7500,true) ON CONFLICT DO NOTHING",
  );
  await db.query(
    "INSERT INTO promotions VALUES('TEST10',10,true,'2099-01-01') ON CONFLICT DO NOTHING",
  );
  await db.query(
    "INSERT INTO users(id,email,password_hash,name,role) VALUES('test-admin','admin@example.invalid',$1,'Test administrator','admin') ON CONFLICT DO NOTHING",
    [await passwordHash("Test-admin-password-123")],
  );
}
