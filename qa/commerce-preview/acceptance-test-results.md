# Prototype acceptance results

Gate: **BLOCKED**. 32 PASS /0 FAIL /2 BLOCKED /0 SKIPPED across34 required acceptance cases. Actual app email delivery is a separate post-prototype item.

Repository: commerce/production-upgrade-20261027; acceptance-start commit 51497d88ef604ce396698a5f8e9f0147c5034d91. Deployed implementation7ec7a42; final evidence commit is reported in final delivery. Runtime code was not changed during closure.

| Case | Result | Expected | Actual | Evidence |
|---|---|---|---|---|
| ENV-01 | PASS | Existing Preview READY | Existing deployment inspected READY; no redeployment needed | deployment-evidence.json |
| ENV-02 | PASS | Authorized UI and API routes function | Real shop/product/cart/checkout/order/account/admin routes exercised | prototype-journey-results.json |
| ENV-03 | PASS | Preview PostgreSQL responds and migrations current | Real queries and all16 expected public tables; no outstanding migration | prototype-database-state.json |
| ENV-04 | PASS | Server-only sandbox settings and correct origin/callback | Runtime sandbox health, accepted signed R100 form, correct merchant/URLs; all configured keys target Preview | deployment-evidence.json; prototype-journey-results.json |
| ENV-05 | PASS | Provider callback accessible without broad protection disable | Invalid ITN400 BAD_SIGNATURE, alias root404, protected storefront302 | prototype-access-checks.json |
| ENV-06 | PASS | Production unchanged; no live credentials or live payment | Production alias unchanged; Preview-only variables and fixed sandbox action verified | deployment-evidence.json |
| DATA-01 | PASS | One reusable requested test-only SKU, initial stock5, priceR100, shippingR0 | Stable product/variant RP-QA-001 upserted; older R5 fixture deactivated; remaining stock3 after actual tests | prototype-database-state.json; prototype-product.png |
| DATA-02 | PASS | Secure test customer and authorized admin provisioned | Synthetic accounts registered through existing API; trusted operator promoted only designated admin; role tests passed | prototype-journey-results.json; prototype-database-state.json |
| JOURNEY-01 | PASS | Open authorized shop | Shop rendered | prototype-journey-results.json |
| JOURNEY-02 | PASS | Display test product | Product and variant selected | prototype-journey-results.json; prototype-product.png |
| JOURNEY-03 | PASS | Select Black/Medium | Product and variant selected | prototype-journey-results.json; prototype-product.png |
| JOURNEY-04 | PASS | Add one item to guest cart | Cart API and UI agree | prototype-journey-results.json; prototype-cart.png |
| JOURNEY-05 | PASS | Validate qty1 price/subtotalR100 | Cart API and UI agree | prototype-journey-results.json; prototype-cart.png |
| JOURNEY-06 | PASS | Authenticate customer | Customer authenticated; cart retained | prototype-journey-results.json |
| JOURNEY-07 | PASS | Preserve cart across authentication | Customer authenticated; cart retained | prototype-journey-results.json |
| JOURNEY-08 | PASS | Enter test delivery details | Review displayed requested total | prototype-journey-results.json; prototype-review.png |
| JOURNEY-09 | PASS | Review authoritative totalR100 | Review displayed requested total | prototype-journey-results.json; prototype-review.png |
| JOURNEY-10 | PASS | Submit checkout | Pending order and payment confirmed | prototype-journey-results.json; prototype-pending.png |
| JOURNEY-11 | PASS | Confirm pending order/payment | Pending order and payment confirmed | prototype-journey-results.json; prototype-pending.png |
| JOURNEY-12 | PASS | Validate reference, amount and stock reservation | Pending order and payment confirmed | prototype-journey-results.json; prototype-pending.png |
| PAY-01 | PASS | Real sandbox checkout, verified ITN and correct PAID order | Actual R100 wallet transaction3479203; one COMPLETE event, one paid order and queued receipt; browser return not used as verification | prototype-paid.png; prototype-database-state.json |
| PAY-02 | PASS | Actual gateway cancellation never marks order paid | Actual PayFast cancel dialog/return; order remains pending, zero events/receipts; stock held pending reconciliation | prototype-cancelled.png; prototype-database-state.json |
| PAY-03 | BLOCKED | Execute real provider-supported FAILED scenario | Provider docs: funded wallet only, all payments successful. Controlled FAILED tests pass but do not satisfy real-provider case | payment-sandbox-results.md; check.log; commerce-e2e.log |
| PAY-04 | PASS | Invalid/tampered notification rejected without paid mutation | Fresh external callback400 BAD_SIGNATURE; controlled forged-callback tests also pass | prototype-access-checks.json; check.log |
| PAY-05 | BLOCKED | Replay previously validated real provider notification and prove idempotency | Provider docs: notifications sent only once; no real replay obtained. Controlled valid-duplicate tests pass; not counted as real sandbox evidence | payment-sandbox-results.md; check.log |
| PAY-06 | PASS | Incorrect amount fails safely in controlled integration test | Signed callback with wrong amount rejected; no incorrect payment recorded. Controlled verification, not a real sandbox ITN | check.log; tests/integration/commerce.test.js |
| PAY-07 | PASS | Retry does not duplicate order/reservation/fulfillment | Real checkout repeated with same key returns same pending order; stock decreased once. Controlled event retries also pass | prototype-journey-results.json; check.log |
| REG-01 | PASS | Lint succeeds | PASS | check.log |
| REG-02 | PASS | Production build succeeds | PASS | check.log |
| REG-03 | PASS | Unit tests execute | 12 passed/0failed/0skipped | check.log |
| REG-04 | PASS | API/integration suite executes | 17 passed/0failed/0skipped | check.log |
| REG-05 | PASS | Commerce browser suite executes | 7 passed/0failed/0skipped; mocked gateway explicitly labelled | commerce-e2e.log |
| REG-06 | PASS | Original regression executes | 7 passed/0failed/0skipped | regression.log |
| MAP-01 | PASS | As-built flows, exceptions and states documented | Two Mermaid diagrams and API/state matrix label VERIFIED, IMPLEMENTED BUT UNTESTED or NOT IMPLEMENTED | e2e-process-map.md |

## Execution commands

```sh
npm run check
PLAYWRIGHT_CHROMIUM_EXECUTABLE=<installed Chromium> npm run test:commerce
PLAYWRIGHT_CHROMIUM_EXECUTABLE=<installed Chromium> npm test
npm audit --omit=dev
node --env-file=.env.local qa/commerce-preview/prototype-customer-journey.mjs
# Bounded history-locator repair resumed the existing paid order:
PROTOTYPE_RESUME_ORDER=cd487f247e02f59753974bceddc3161be56ca5d8648fafaf node --env-file=.env.local qa/commerce-preview/prototype-customer-journey.mjs
```

Build/browser execution was sequential. 43 existing tests passed; no automatic tests were skipped. Additional hosted journey assertions passed after the recorded harness repairs. All phases ran except the two unsupported real-provider cases. Credentials are not in logs or source. See defect-register.md for every failed attempt.
