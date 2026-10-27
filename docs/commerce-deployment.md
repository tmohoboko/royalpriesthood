# Deployment and operator runbook

## Target and release boundary

Existing repository: https://github.com/tmohoboko/royalpriesthood. Existing Vercel project recorded by repository: `royalpriesthood`, ID `prj_IZuPhIVC8rI7nLzV1SdJifoaQaRp`, team `tmdev` (`team_rxAiJBN1D2QABFZejXx5v3cm`). Preserve https://royalpriesthood-two.vercel.app/. Do not create a replacement project. Verify these IDs through authenticated project inspection before deployment. Production promotion and payment setting changes require separate explicit approval.

This release is sandbox-only in code. `PAYFAST_MODE=live` fails closed. The original `scripts/release-vercel.sh` publishes production and must NOT be used for this commerce preview. Its production behavior was not changed because it belongs to an earlier release workflow.

## Environment

Configure through Vercel's secret settings; never send credentials in chat or commit .env files. All fields below are server-only except VITE_CONTACT_EMAIL.

| Variable | Purpose/dependency |
|---|---|
| DATABASE_URL | Isolated preview PostgreSQL connection with verified TLS; scoped runtime account |
| APP_ORIGIN | Exact HTTPS preview origin; used for CSRF and gateway return/notify URLs |
| PAYFAST_MODE | sandbox; blank disables checkout/payment |
| PAYFAST_MERCHANT_ID | PayFast sandbox merchant account ID |
| PAYFAST_MERCHANT_KEY | Corresponding sandbox hosted-payment key |
| PAYFAST_PASSPHRASE | Sandbox signing passphrase configured in PayFast account |
| RESEND_API_KEY | Transactional email API credential |
| EMAIL_FROM | Approved sender on a verified sending domain |
| VITE_CONTACT_EMAIL | Optional public catalogue enquiry recipient |

Resumed authenticated inventory returned no existing variables. Configured DATABASE_URL as sensitive and APP_ORIGIN as plain, Preview only. No production variables changed. The project has no Git connection, so branch-specific variables are unavailable; these two apply to Preview generally, using an isolated development database. Merchant/email variables remain absent.

## Database migration and administration

1. Provision/identify an isolated preview database in the approved region. Do not point development or test data at production. Use the existing provider if project inspection reveals one.
2. Set DATABASE_URL locally in ignored .env or via a secure environment. Run `npm run db:migrate`. The initial migration is additive, transactional and rerunnable; it preserves existing records and inserts inactive catalogue references only. Hosted migration and additive replay were executed successfully on the isolated Neon branch described below.
3. Use a migration-capable credential only for deployment setup. Give the runtime database account CRUD rights on commerce tables, with no DDL or unrelated schema access. Keep TLS verification enabled.
4. Register the intended admin through the normal UI, then run `ADMIN_EMAIL=owner@example.com npm run admin:grant` as a trusted database operator. There is no automatic first-user administrator or hard-coded deployed admin password.
5. Configure actual saleable products, descriptions identifying exactly what is sold, approved image paths, variant identities/prices/available stock, shipping prices and any promotion. The recovered catalogue includes styled looks and separate front/back views; deduplicate into real SKUs before activation. Do not use automated fixture prices/stock in a deployed catalogue.

No irreversible migration or production data write was executed. For rollback, leave the additive schema in place and roll back application code; do not drop customer or order tables. Backup and exercise restoration with the selected provider before production.

## Verification and preview

Use Node 22.22+ and `npm ci`, `npm run check`, `npx playwright install --with-deps chromium`, `npm test`, `npm run test:commerce`. Existing JavaScript code is retained; ESLint and build validate syntax/modules, with Zod validating boundary data. There is no existing TypeScript project and no claim of a TypeScript type-check. Do not treat `vite preview` as a backend server. For normal local development use `npm run dev:commerce` with a real development database. For automated fixtures use `node scripts/commerce-test-server.mjs` after building; this binds loopback and mocks payments/email.

After team authorization, inspect the existing Vercel project, environment-variable names and production branch. Commit/push the commerce branch, then create a preview on the existing project only. With an authenticated CLI linked to verified IDs, use `vercel deploy --target preview --scope tmdev`; never add `--prod` or promote. Alternatively create an MCP Git deployment for the exact pushed commit/project with a preview target. Confirm Vercel's Git integration will not promote this feature branch. No deployment settings should point production to this branch.

Set APP_ORIGIN to the acceptance preview alias and redeploy if needed; callbacks must use a stable reachable HTTPS host. Verify the function receives the original `/api/commerce/...` path through rewrites, cookies persist between calls, and direct refreshes on `/shop/products/:id`, `/shop/checkout`, `/shop/account`, `/shop/orders/:id` serve the SPA. Check health plus authenticated routes against a real database; a static homepage alone does not verify commerce.

Ensure PayFast can POST the notify endpoint without deployment-authentication redirects. Do not put a protection bypass secret in publicly shared checkout fields. Use a preview environment accessible to the sandbox callback with the least necessary access, or a separately approved stable callback host. Validate the Vercel ingress IP header and DNS allowlist behavior with a real sandbox notification. Collect provider transaction ID, verified callback result, paid order record and accepted receipt ID as evidence; redact customer details.

## Operational follow-up

Reservations remain held after the 30-minute initiation window; automatic expiry/reconciliation is not installed. Customers can cancel unissued orders. In-flight or ambiguous payments require provider reconciliation before releasing stock. Failed/cancelled verified payments can be cancelled and recreated. Refund state is modeled but gateway refund execution is not implemented: use approved provider operations and add verified reconciliation before marking refunded.

The durable outbox retries on registration, ITN, fulfilment changes and explicit admin processing. For automatic retries without customer traffic, configure an approved scheduler/queue after inspecting current jobs. No scheduler/configuration was replaced. Monitor exhausted jobs and provider delivery/bounce events (delivery webhooks are future work). A provider acceptance response does not guarantee inbox arrival.

Image management supports approved existing asset paths; binary uploads require a configured object-storage service and an authenticated upload implementation. Password recovery/email verification/MFA and high-volume pagination remain pre-public-launch work.

## Acceptance procedure after external configuration

1. Open the preview on desktop and a 375px mobile viewport. Browse/search/filter/sort an approved active product and select size/colour.
2. Add to cart; change quantity and reload. Check persisted quantity and totals. Remove/re-add an item.
3. Proceed to checkout. Register a customer (password ≥12 characters), or sign in. Verify the guest cart survives. Check welcome message acceptance/inbox separately.
4. Enter recipient, South African phone, street, city, province and four-digit postal code. Select configured delivery and optionally an active discount code. Review authoritative totals.
5. Place the pending order once. Refresh/retry an interrupted request using the same key; only one order/reservation should exist.
6. Continue to the real PayFast sandbox. Complete a supported sandbox transaction. Return to the preview: the page remains pending until ITN is verified. Confirm the provider transaction reference, paid status and confirmation/receipt outbox record. Verify receipt content and actual mailbox delivery.
7. Check account order history and saved addresses. As admin, mark the paid order dispatched with tracking, then delivered. Customer sees status/tracking and receives the status update.
8. Repeat with sandbox failure/cancellation and an unavailable variant. Confirm no unpaid order gets a paid receipt, repeated ITNs do not duplicate receipts, unavailable stock prevents checkout, and customer accounts cannot open admin endpoints.

External acceptance (steps involving real provider, mailbox, hosted database and preview) has NOT been executed in this environment.

## Hosted database evidence — 2026-10-27

The existing Neon project `royalpriesthood-customer-testing` (`wandering-truth-80965521`) was discovered through the connected service. Its original `customer-testing` branch had no tables. Created isolated child `commerce-upgrade-20261027` (`br-calm-rice-b7mcxqw7`) from `br-curly-lab-b7tn8197`; the parent was not changed. The first branch request with an explicit suspend timeout was rejected by the account; retry without that option succeeded.

The migration script completed against hosted PostgreSQL; replay of its 19 additive statements through the connected SQL service also succeeded. Inspection confirmed all 16 expected tables, 16 inactive products, zero variants and zero orders in the public schema. Connection details are in owner-readable, ignored `.env.commerce-preview` (mode 0600), never committed. This setup credential should be replaced with a scoped runtime role before deployment.

Subsequent direct TCP connections timed out. A standalone WebSocket SELECT succeeded, but the hosted integration suite failed during connection setup over both TCP and WebSocket transports: **0 passed, 16 failed, 0 skipped** per attempt, before API assertions. These failures do not invalidate local results and do not establish hosted runtime readiness. Logs are retained in qa/commerce-hosted-*.log. Hosted test schemas are isolated from public catalogue records and retained if created; no destructive cleanup was performed.

Optional hosted verification (only an isolated approved database): `COMMERCE_HOSTED_TEST=1 node --env-file=.env.commerce-preview --test tests/integration/commerce.test.js`. Add `COMMERCE_HOSTED_TRANSPORT=websocket` for the dev-only Neon transport. Each run uses a new schema; it never replaces public catalogue data. The deployed application continues to use pg over verified TLS.

## Resumed preview release evidence

Stable preview: https://royalpriesthood-commerce-preview-tmdev.vercel.app/ . Immutable deployment: https://royalpriesthood-chtq7ptks-tmdev.vercel.app/ . Deployment ID dpl_D9pfef8FbRdDsAsqaLz12tcRqjKn, READY. Implementation commit 3d70341f66351976b19520c69be02428813337f4 was uploaded through CLI 62.2.0 using `deploy --target preview --project prj_IZuPhIVC8rI7nLzV1SdJifoaQaRp --scope tmdev --yes --no-wait`; no production flag or promotion was run. Git deployment was rejected because the project has no Git connection. No Git integration was added.

The isolated database now uses rp_commerce_preview with CRUD on commerce tables; it cannot create schemas/tables, databases or roles and is not superuser. Setup-owner credentials were not deployed. APP_ORIGIN matches the stable preview hostname; use that hostname for forms and acceptance. The immutable hostname can serve read requests but its mutation origin differs from configured APP_ORIGIN.

Protection is preserved. Sign into Vercel as an authorized tmdev member to open the preview; automated requests used the linked project's short-lived development OIDC token, never committed. 21 deployed smoke checks passed, including database-backed registration, secure session cookies, reload/login persistence, delivery addresses, order history and role denial. One synthetic example.test customer/address remains on the isolated preview branch; no admin was granted and no order/payment was created. Screenshots, script and logs are in qa/commerce-preview/.

Real PayFast testing is blocked by missing sandbox merchant ID/key/passphrase and PAYFAST_MODE, missing owner-approved product variants/stock/prices and shipping, and callback reachability: unauthenticated notify POST returns HTTP 302 to Vercel authentication. Resolve access specifically for the approved callback route/host without broadly disabling deployment protection. Real receipts need RESEND_API_KEY and a verified EMAIL_FROM; no email credential or sender is configured. The test welcome job is queued/retryable, not proof of delivery.

Production alias was inspected after preview deployment and still points to original dpl_9vFzqtHSBVXwgEZSv3cm1WZtoAzG. Production environment/domain/payment settings were not changed.

## Payment callback configuration after gate repair

PAYFAST_MODE=sandbox, sandbox merchant ID/key/passphrase and PAYFAST_NOTIFY_ORIGIN=https://royalpriesthood-payfast-itn-tmdev.vercel.app are Preview-only configuration. APP_ORIGIN remains the protected stable storefront. Root proxy.js and server/callback-policy.js guard every path on the dedicated public callback alias. The alias-specific protection exception was created only after authenticated verification of the guard. Missing preview/sandbox settings, query strings, non-POST methods and every other path return404. All actual ITNs still pass the full production verifier. Do not put Vercel automation bypass secrets in browser-visible payment fields.

Callback exception requires the guarded deployment: do not alias this hostname to an older build. To retire it, remove its alias-specific exception before removing the guard. The exception is not a project-wide protection disable. The repair uses audited @vercel/functions 3.6.1 for routing continuation (newer3.10.4 introduced a vulnerable transitive Zod pin); final production dependency audit reports zero vulnerabilities.

Real sandbox acceptance succeeded with PayFast transaction3479071. Both actual successful checkout and gateway cancellation were exercised. The cancelled checkout remains pending awaiting reconciliation, with stock held and no receipt; do not release an in-flight reservation based on its browser return. App email acceptance still needs RESEND_API_KEY and verified EMAIL_FROM. See release report and qa/payment-gate/ for exact evidence; prior missing-merchant/callback blockers above are historical.
