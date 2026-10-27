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
| Vercel preview | Existing team's connected-app grant returns 403. No preview URL or hosted acceptance evidence yet. No production promotion occurred. |
| Persistent hosted backend | PostgreSQL DATABASE_URL is absent locally; Vercel env inventory inaccessible. Migration is executed in embedded SQL tests, not on a hosted database. |
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

Final local automated result: **39 passed, 0 failed, 0 skipped** (10 unit, 15 API/integration, 7 existing browser regression, 7 commerce browser). `npm run check` runs lint, both Node test suites and production build. Both Playwright suites ran with installed Chromium via PLAYWRIGHT_CHROMIUM_EXECUTABLE. Exact logs/results/screenshots are in `qa/commerce-*`; details in [commerce-test-matrix.md](commerce-test-matrix.md). Dependency audit result is in `qa/commerce-audit.log`.

The gateway's DNS and verification response and the email HTTP API are mocked. Production verifier logic still executes in integration tests. No live payment, actual PayFast sandbox success, external mailbox receipt or hosted deployment was fabricated. Initial missing-browser failures, the wrong test vector and browser-discovered login defect were resolved before final passing runs. No outstanding failing local tests are known; external acceptance and the partial features above remain outstanding.

## D. Deployment

Target remains existing project prj_IZuPhIVC8rI7nLzV1SdJifoaQaRp under tmdev, with production domain https://royalpriesthood-two.vercel.app/. Public production HEAD returned HTTP 200 during audit; this does not verify new commerce code there. Production domain, payment settings and production branch were not changed.

Preview URL: unavailable at report creation. Vercel project reads returned 403 for missing team authorization. Git-based preview availability, if triggered by pushing this feature branch, must be checked separately and must not be confused with a working backend. The [deployment runbook](commerce-deployment.md) specifies environment variables, additive migrations, scoped database access, administrator provisioning, callback reachability, preview commands and rollback. The old production release script must not be used for this preview.

## E. Acceptance testing

Full exact external procedure is in [commerce-deployment.md](commerce-deployment.md#acceptance-procedure-after-external-configuration). Configure preview services, activate approved product/variants, then browse → choose variant → cart/quantity/refresh → register/login → delivery → review → pending order → real PayFast sandbox → verified ITN → paid confirmation/receipt → account history → admin dispatch/tracking. Repeat failure/cancellation, duplicate callbacks and unavailable stock. Validate inbox delivery separately from API acceptance. Desktop and mobile local versions of this flow passed with explicit gateway/email mocks.

## F. Highest-priority next action

Restore the connected app's access to the existing tmdev Vercel team. This permits inspection of existing environment/backend integrations and creation of the required acceptance preview without replacing the project. Then configure an isolated preview database and the documented merchant/email dependencies. Production release still needs separate approval.
