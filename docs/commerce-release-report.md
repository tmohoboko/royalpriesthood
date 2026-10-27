# Royal Priesthood commerce release evidence — 2026-10-27

**Status: implemented and locally verified; external acceptance incomplete. Not approved for production release.**

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
| Actual sandbox payment | PAYFAST_MODE=sandbox, sandbox merchant ID/key/passphrase and a stable reachable HTTPS APP_ORIGIN required. Live mode is rejected in code. No real sandbox transaction executed. |
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
