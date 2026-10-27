# Royal Priesthood commerce release evidence — 2026-10-27

**Status: sandbox payment acceptance PASSED; app email acceptance blocked. Not approved for production release.**

## A. Repository

- Repository: https://github.com/tmohoboko/royalpriesthood (private).
- Working branch: commerce/production-upgrade-20261027.
- Checkout: /home/tmdev012/Reception/royalpriesthood-commerce.
- Starting commit: 1afa03c (Install image decoder required for original catalogue verification).
- Latest upstream reviewed and incorporated: 6d14e6523c9e83a9ece6d794da7ffe29e1f633b6 (approved original PNGs and prior QA evidence only).
- Release commit: the commit containing this report; resolve with `git rev-parse HEAD` or use the final delivery message. A commit cannot embed its own hash in its contents.
- Exact changed-file inventory: [commerce-changed-files.txt](commerce-changed-files.txt), relative to the starting commit. Original assets are inherited from the reviewed upstream commit; none were generated or replaced.

## B. Functionality

Implemented: existing editorial/enquiry features preserved; commerce routes with active catalogue, search/filter/sort, configurable promotions, detail/size/colour selection, persistent guest/customer cart, registration/login/logout, profile and delivery addresses, review/progress, server-authoritative pending orders, stock reservation, idempotency, PayFast hosted sandbox initiation and verified ITN processing, paid confirmation/order history/tracking, transactional confirmation/receipt outbox, retryable notifications, admin products/approved image paths/variants/prices/stock/promotions/shipping/orders/fulfilment and delivery visibility. No customer can invoke admin operations or view another customer's order.

Partial/missing:

| Dependency or feature | Exact release limitation |
|---|---|
| Vercel preview | READY at https://royalpriesthood-commerce-preview-tmdev.vercel.app/ . Vercel authentication retained. 21 hosted smoke assertions pass; no production promotion. |
| Persistent hosted backend | Existing Neon project discovered; isolated branch commerce-upgrade-20261027 migrated successfully with 16 tables and 16 inactive catalogue entries. Preview DATABASE_URL and APP_ORIGIN are now configured. Deployed API connectivity/session/address persistence passed; the optional integration suite still fails at connection setup from the local machine. Hosted contention remains unverified. |
| Actual saleable catalogue | Owner-approved product contents/SKUs, ZAR prices, variant availability and shipping tariffs required. Migration seeds inactive catalogue references only. |
| Actual sandbox payment | PASS: real R5 sandbox transaction 3479071, verified COMPLETE ITN, paid order. See acceptance gate evidence below. Live mode remains rejected. |
| Actual email delivery | RESEND_API_KEY, EMAIL_FROM and verified sending domain needed, or adapt to an existing provider discovered after project access. Test delivery is mocked; sent means provider acceptance only. |
| Notification automation | Durable retries and admin drain exist; unattended scheduler/queue and bounce/delivery callbacks are not configured. No scheduler was changed. |
| Images | Existing approved asset path management works. New binary uploads need approved object storage and an upload endpoint. |
| Refunds | Payment/order refund states exist; provider refund execution and verified synchronization are not implemented. Merchant capabilities and dedicated verification required. |
| Reservation reconciliation | Unissued pending orders can be cancelled; issued/ambiguous payments require reconciliation. No automatic release of in-flight payment stock. |
| Account hardening | Email verification, password recovery and MFA are not implemented. |
| Static types/load | Existing JavaScript retained; no TypeScript type-check. Hosted PostgreSQL multi-connection/load verification and large-order-list pagination remain. |

## C. Test evidence

Final local automated result: **40 passed, 0 failed, 0 skipped** (10 unit, 16 API/integration, 7 existing browser regression, 7 commerce browser). `npm run check` runs lint, both Node test suites and production build. Both Playwright suites ran with installed Chromium via PLAYWRIGHT_CHROMIUM_EXECUTABLE. Exact logs/results/screenshots are in `qa/commerce-*`; details in [commerce-test-matrix.md](commerce-test-matrix.md). Dependency audit result is in `qa/commerce-audit.log`.

The gateway's DNS and verification response and the email HTTP API are mocked. Production verifier logic still executes in integration tests. No live payment, actual PayFast sandbox success, external mailbox receipt or hosted deployment was fabricated. Initial missing-browser failures, the wrong test vector and browser-discovered login defect were resolved before final passing runs. No outstanding failing local tests are known; external acceptance and the partial features above remain outstanding.

## D. Deployment

Target remains existing project prj_IZuPhIVC8rI7nLzV1SdJifoaQaRp under tmdev, with production domain https://royalpriesthood-two.vercel.app/. Public production HEAD returned HTTP 200 during audit; this does not verify new commerce code there. Production domain, payment settings and production branch were not changed.

Preview: https://royalpriesthood-commerce-preview-tmdev.vercel.app/ (Vercel authentication required). Immutable deployment: https://royalpriesthood-chtq7ptks-tmdev.vercel.app/ , ID dpl_D9pfef8FbRdDsAsqaLz12tcRqjKn, READY. Deployed implementation is exactly 3d70341f66351976b19520c69be02428813337f4; later commit contains evidence/docs only. Existing project has no connected Git repository, so used authenticated CLI source upload with explicit --target preview after checking the linked team/project. DATABASE_URL (sensitive) and APP_ORIGIN are preview-only; production variables remain untouched. Production alias still resolves to dpl_9vFzqtHSBVXwgEZSv3cm1WZtoAzG, matching the pre-deployment state.

All 40 local tests passed on resumption. Additional deployed checks: **21 passed, 0 failed** covering deep links, actual Neon catalogue, registration/login/logout, secure session cookie, refresh persistence, saved address, history, authorization and mobile layout. See qa/commerce-preview/. Optional hosted integration: 0 passed / 16 setup failures from local TCP timeout. Deployed checkout/payment/receipts were not exercised because catalogue/shipping and gateway/email credentials are absent. External unauthenticated notify POST returned 302 to Vercel authentication, requiring an approved callback-access solution before real PayFast sandbox acceptance.

## E. Acceptance testing

Full exact external procedure is in [commerce-deployment.md](commerce-deployment.md#acceptance-procedure-after-external-configuration). Configure preview services, activate approved product/variants, then browse → choose variant → cart/quantity/refresh → register/login → delivery → review → pending order → real PayFast sandbox → verified ITN → paid confirmation/receipt → account history → admin dispatch/tracking. Repeat failure/cancellation, duplicate callbacks and unavailable stock. Validate inbox delivery separately from API acceptance. Desktop and mobile local versions of this flow passed with explicit gateway/email mocks.

## F. Highest-priority next action

Provide the PayFast sandbox merchant ID/key/passphrase through Vercel Preview secrets and approve a provider-accessible callback route/host. PAYFAST_MODE must remain disabled until these dependencies and owner-approved saleable products/shipping are configured. Add RESEND_API_KEY and verified EMAIL_FROM for real receipts. No production promotion is authorized.

Hosted verification update: migration and replay succeeded on isolated Neon, but hosted API attempts report 0 passed / 16 failed at connection setup (TCP timeout and WebSocket transport error). This remains an unresolved external test failure; 40 passing tests refer to local suites only. See deployment runbook and retained logs.

Resume evidence: the earlier hosted-runtime connectivity limitation is resolved on Vercel for the exercised API paths; local TCP integration setup still fails. Final implementation CI passed: https://github.com/tmohoboko/royalpriesthood/actions/runs/40487058707 .

## Sandbox payment acceptance gate — 2026-10-27

**PASS for sandbox payments; actual email delivery remains a separate blocked item.** User-requested deployment dpl_9BVi3y2ByZ9FRkB7VJyBEWs7wCkn reached READY with sandbox mode loaded. The callback repair was deployed as dpl_9xC2hhfPwJTNY5jtWZoZfMekZgFk (READY), implementation 7ec7a42c395b231a2dec028c1a2bd209f4d4dea4. Stable preview: https://royalpriesthood-commerce-preview-tmdev.vercel.app/ . Immutable URL: https://royalpriesthood-4ojcibn9u-tmdev.vercel.app/ .

A single clearly labelled TEST ONLY product/variant was created on isolated Neon branch br-calm-rice-b7mcxqw7: R5.00, initial stock ten, no physical delivery. No real catalogue stock/prices were activated. Actual PayFast sandbox wallet transaction **3479071** paid order **e5088faa6dae7ab37d23a2cc1f9836362b081e4197f007fd**, total 500 cents. Database was observed pending before gateway completion and paid after the real ITN. One COMPLETE payment event and one receipt job exist. Signature, merchant, DNS/source-IP and PayFast server VALID verification execute before authoritative order/amount/status processing; no test verifier was injected into the deployment.

A second actual sandbox checkout was cancelled through PayFast's confirmation dialog. Order a0c58b6385e93eb1d8fe937cd28bba6a7f38d68f16193e41 remains pending with no provider ID, event or receipt. The browser cancellation is not proof of a verified cancellation: its reservation remains held for reconciliation. No database status or inventory was manually altered to simulate success/cancellation.

Callback: https://royalpriesthood-payfast-itn-tmdev.vercel.app/api/commerce/payfast/notify . Automation bypass credentials are project-wide, and notify_url is browser-visible, so no bypass secret was exposed in the hosted form. Instead, a protection exception applies only to this dedicated preview alias; the routing guard allows only exact sandbox Preview POST to the ITN path, without query parameters. Other paths/methods, missing configuration and production/live environments fail closed. Storefront authentication and production protection settings remain unchanged. Never point this public callback alias at a deployment without the guard.

Executed validation: **43 local tests passed /0 failed /0 skipped** (12 unit,17 API,7 original browser,7 commerce browser), lint/build passed, dependency audit zero vulnerabilities. **12 live assertions passed**, including public callback boundary, invalid-signature rejection, paid database evidence, cancelled order safety and storefront protection. One initial browser run collided with a parallel build deleting dist (2 passed/5 failed); serialized rerun passed all seven. Valid duplicate notification, FAILED status, signed wrong merchant, unknown payment reference, amount mismatch and unsupported status were exercised through automated gateway HTTP/DNS mocks. No second real provider notification or real FAILED provider event is claimed. Actual invalid-signature replays returned HTTP400 and left one paid event/one receipt.

Evidence: qa/payment-gate/gate-result.json, database-final.json, provider-outcome.json, live-assertions.json, order-evidence.json, screenshots and suite logs. The queued receipt has sent_at NULL and zero delivery attempts; **RESEND_API_KEY and verified EMAIL_FROM** remain required for app email acceptance. PayFast's own success-screen receipt message is not evidence of application email or inbox delivery.

Production domain still resolves to original dpl_9vFzqtHSBVXwgEZSv3cm1WZtoAzG. No production payment variables were configured and no promotion was performed. This sandbox gate does not authorize live processing or establish public-launch readiness.

## Strict prototype closure gate

The later master closure scope requires real provider failure and real valid-ITN replay. Final gate: **BLOCKED —32PASS/0FAIL/2BLOCKED**, despite verified real R100 success(transaction3479203) and43 passing regression tests. The PayFast sandbox cannot supply those two real scenarios under its documented funded-wallet/once-only notification behavior. Earlier payment-gate PASS used a narrower scope with clearly labelled controlled failure/replay coverage; it is not substituted for this stricter closure. Canonical closure package: qa/commerce-preview/prototype-closure-report.md. No runtime/production change was made during closure.
