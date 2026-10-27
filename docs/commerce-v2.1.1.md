# Royal Priesthood Commerce v2.1.1 stabilization

Scope: RP-211-01 through RP-211-04. Shop is canonical; shared cards, images, Wishlist, Cart, login, order history and the existing PayFast verifier remain in place. Legacy /catalogue[/...] and /shop/catalogue redirect to /shop; the browser handles /#catalogue since URL fragments never reach the server. Women/Men lead to Shop with category query parameters. The editorial homepage and its shared product preview remain intact.

Discount input is optional. Both quote and checkout normalize whitespace/case; invalid nonempty codes fail authoritative validation. The client clears stale review state and renders the error at the field. Existing TEST10 behavior remains covered by local regression; no new promotion system or hosted coupon was created.

Inventory contract: variants.stock is available inventory. Pending checkout atomically locks variants and reserves/decrements stock once; verified COMPLETE commits PAID and receipt queue state without a second stock decrement. Valid duplicate callbacks are idempotent. Browser return is not proof. Initiated unresolved pending orders retain their reservations for reconciliation; no automatic unsafe release or legacy restock was introduced. Product/Cart reads refresh on tab focus and product data refreshes after relevant mutations and paid status.

UAT fixture version: RP211-UAT-1. Additive migration 003-uat-catalogue.sql adds sandbox_only, reference_product_id and fixture_version metadata. Five separate products clone the existing approved identity/image/category as explicitly named UAT TEST references; originals are not activated or priced. Ten synthetic variants (M/Black, L/Gold) start with six units each. Synthetic ZAR prices in cents: Women12500/13500, Men14500/15500, T-Shirts10000/11000, Hats7500/8500, Accessories9500/10500. These are not approved production prices or real stock.

Seed usage on the existing isolated Preview connection:

    PAYFAST_MODE=sandbox node --env-file=.env.commerce-preview scripts/commerce-uat211.mjs apply br-calm-rice-b7mcxqw7
    PAYFAST_MODE=sandbox node --env-file=.env.commerce-preview scripts/commerce-uat211.mjs reverse br-calm-rice-b7mcxqw7

The operator must target the verified Neon project wandering-truth-80965521, branch br-calm-rice-b7mcxqw7, database royalpriesthood. The runner rejects production, requires sandbox mode, exact branch argument and the database/transaction guard. A branch-name setting is an operator assertion; actual branch identity is verified independently via the connected Neon target. Seed inserts owned fixture identities only, checks collisions and reactivates only its own fixture set. Replay never resets prices/stock; reverse only deactivates owned products, preserving variants, consumed inventory, customer data and order references. The connected SQL transaction path is used when direct local connectivity is unavailable. Never point this seed at production.

Synthetic products are rendered with an explicit sandbox label. They are only exposed/purchasable when PAYFAST_MODE=sandbox and VERCEL_ENV=preview (or isolated local NODE_ENV=test without Vercel). Cart, quote, checkout and Wishlist move enforce the same server policy. The existing global payment configuration still rejects live mode. Receipt pending/sent/failed mappings remain unchanged; queued is not sent or delivered.

Release/test evidence: qa/rp-v2.1.1/. Prior v2.1 artifacts and tag remain intact. No production migration, deployment or promotion is authorized.
