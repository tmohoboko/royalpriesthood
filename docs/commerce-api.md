# Commerce API

Base `/api/commerce`. JSON responses; errors `{ "error": { "code": "...", "message": "..." } }`. Mutations require `Content-Type: application/json` and an `Origin` exactly matching APP_ORIGIN. Session and guest-cart cookies are HttpOnly; do not set identity headers or pass user IDs. Prices are ZAR cents. Request bodies limited to 64 KiB. Unauthenticated: 401; forbidden: 403; validation: 400; stock/conflict: 409; missing configuration: 503.

| Method/path | Access | Input/result |
|---|---|---|
| GET /health | Public | Configuration booleans only, no database query/secrets |
| POST /auth/register | Public, throttled | email, password (12–128 chars), name; creates customer, merges cart, sets session |
| POST /auth/login | Public, throttled | email/password; merges guest cart and rotates token |
| POST /auth/logout | Session optional | Revokes current session and clears cookie |
| GET /me | Public/session | user or null, owned saved addresses |
| PATCH /me | Customer | name |
| POST /addresses | Customer | Delivery address fields below |
| GET /products | Public | active products with variants, prices/available stock, active shipping options and current promotional codes |
| GET /cart | Public/session | Creates/reads durable guest or customer cart |
| PUT /cart | Public/session | variantId, quantity 0–99 (0 removes); validates availability |
| POST /quote | Customer | shippingId, optional code; authoritative items and totals |
| POST /checkout | Customer | address, shippingId, code, idempotencyKey (16–100 chars); 201 pending order; requires configured sandbox |
| GET /orders | Customer | Owned order history |
| GET /orders/:id | Owner | Order, immutable items, payment summary, notification statuses |
| POST /orders/:id/pay | Owner | Empty object; signed sandbox action and fields; same pending payment reused |
| POST /orders/:id/cancel | Owner | Empty object; releases inventory once where safe; in-flight payments require reconciliation |
| POST /payfast/notify | Verified gateway | Raw application/x-www-form-urlencoded ITN; signature, merchant, IP, server validation, amount checks |
| GET /admin/products | Admin | All catalogue/variant/promotion/shipping records |
| PUT /admin/products | Admin | id, name, description, image (/images path), category, active |
| PUT /admin/variants | Admin | id, product_id, size, colour, price, stock; identity fields immutable for existing SKU |
| PUT /admin/promotions | Admin | code (uppercase), percent 1–100, active, expires_at (ISO timestamp) |
| PUT /admin/shipping | Admin | id, name, price, active |
| GET /admin/orders | Admin | Latest 200 orders with customer email and payment state |
| GET /admin/orders/:id | Admin | Full order and immutable items for fulfilment |
| PATCH /admin/orders/:id | Admin | status dispatched/delivered, tracking; only paid→dispatched→delivered |
| GET /admin/notifications | Admin | Last 100 delivery records; no API keys/payloads |
| POST /admin/notifications/retry | Admin | Processes up to ten due outbox jobs with row locks |

Delivery address: name, phone, line1, city, province (full official province name), postal_code (four digits), country (ZA). Checkout body deliberately ignores browser-supplied totals, user IDs, role and stock. Categories are the established Women, Men, T-Shirts, Accessories and Hats. A variant's unit price is at least R5; final total must be between R5 and R1,000,000.

Idempotency: reuse the same checkout key if the response was interrupted. It returns the original order when delivery inputs match; changed inputs return IDEMPOTENCY_CONFLICT. A second pending order is rejected. Follow the existing order to retry payment rather than creating another. Signed payment retries retain the same reference; repeated verified events are ignored. Browser return/cancel query strings never mutate payment state.

No role-promotion HTTP endpoint, refund execution endpoint, raw-card endpoint or test-success endpoint is deployed. `__test` routes exist only in the separately launched loopback fixture server, which refuses Vercel/production execution.

Sandbox callback access: POST https://royalpriesthood-payfast-itn-tmdev.vercel.app/api/commerce/payfast/notify is provider-accessible without Vercel login. Only this exact path/method without query parameters is exposed; every ITN must still satisfy signature, merchant, trusted source, gateway server verification, order reference, amount and status checks. Other paths/methods on the callback alias return404. No customer/admin API is publicly exposed through the exception. Real COMPLETE acceptance is recorded in qa/payment-gate/.
