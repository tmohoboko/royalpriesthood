# Executed test matrix — 2026-10-27

Latest payment-gate local result: **43 passed, 0 failed, 0 skipped** (earlier suite tables below preserve prior release execution) across the four automated suites. Lint and Vite production build passed. Production dependency audit: see `qa/commerce-audit.log`. No TypeScript configuration existed; no TypeScript type-check was performed or claimed. ESLint validates JavaScript, React hook placement and module syntax; Zod validates server inputs. Full static type coverage remains an explicit limitation.

| Suite/command | Passed | Failed | Skipped | Evidence |
|---|---:|---:|---:|---|
| npm run test:unit | 10 | 0 | 0 | qa/commerce-check.log |
| npm run test:integration | 16 | 0 | 0 | qa/commerce-check.log |
| npm test | 7 | 0 | 0 | qa/commerce-regression.log and commerce-regression-results.json |
| npm run test:commerce | 7 | 0 | 0 | qa/commerce-e2e.log and commerce-e2e-results.json |
| npm run lint | pass | — | — | qa/commerce-check.log |
| npm run build | pass | — | — | qa/commerce-check.log |
| git diff --check | pass | — | — | Executed before commit |

Browser commands used `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/home/tmdev012/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`. The lockfile's newer Chromium download was initially unavailable; installed Chromium ran the real browser suites successfully. CI installs the matching browser using Playwright. Seven initial browser-launch failures and one incorrect test-vector expectation were corrected; they are not represented as passing initial runs. Browser tests also discovered a login validation defect (empty unused name field); corrected on both client and server and verified by the login journey.

## Coverage

| Requirement/boundary | Executed evidence and limits |
|---|---|
| Prices, discounts, cart totals | Integer cents, rounding, invalid quantity/price/total and empty-cart unit tests; authoritative quote/order API assertions |
| Stock | Active/quantity rules; unavailable variant; checkout revalidates changed stock and rolls back without partial order |
| Authentication/authorization | Registration, login, logout, cart merge, customer/admin restriction, cross-origin rejection, order ownership |
| Persistence | Guest cart refresh in browser; user cart across logout/login; embedded SQL database closed/reopened with hashed-session lookup |
| Checkout | Address validation, shipping, discount, pending order snapshots, stock decrement and cart clear; idempotency replay/conflicting input |
| Payment verification | Production verifier tested for signature, retained empty fields, source-IP allowlist, merchant and server VALID checks; network and DNS explicitly mocked |
| Payment state | Amount mismatch, forged/duplicate fields, callback replay, no regression after paid, failure, verified cancellation and late success after cancellation |
| Email | Welcome trigger, one paid receipt, no unpaid receipt, stable retry key after provider error; Resend HTTP responses mocked, no inbox claim |
| Admin | Protected access, product creation, order list, paid-only fulfilment and tracking; browser sign-in/admin screen |
| Node/Vercel boundary | Real loopback HTTP server tests rewrite query→canonical API path, raw JSON body, multiple cookies and payload limit; hosted Vercel ingress remains unverified |
| Desktop/mobile browser | Discovery, detail/variant, add/change quantity, refresh, register, address, review, pending order, hosted-form mock, callback, confirmation/receipt, order history; 1440px and 375px |
| Failure/cancellation | Browser return remains pending; verified failed payment cannot retry blindly; verified cancelled payment can safely release reservation |
| Original site | All seven previous storefront/enquiry tests pass, image loading, category counts, persisted brief, download fallback, keyboard focus trap and mobile overflow |

## Verification story and boundaries

The customer discovers an item → sends variant/quantity to cart API → database stores cart → login merges cart → checkout locks stock and creates a pending order → signed hosted form is issued → verified notification commits paid state and one receipt job → customer order history displays confirmed state. This entire story passed locally with real HTTP, React, SQL and explicit gateway/email test doubles.

These tests do NOT establish real PayFast sandbox processing, real merchant configuration, inbox delivery, live processing, Vercel callback reachability, hosted PostgreSQL TLS/pooling or multiple independent database connections under contention. Embedded PGlite serializes transactions; a hosted PostgreSQL concurrency/load run is required before production. No live credentials or actual successful payment are claimed. Preview acceptance is blocked by Vercel team authorization and missing external configuration.

## Reproduce

```
npm ci
npm run check
npx playwright install --with-deps chromium
npm test
npm run test:commerce
```

For an already installed supported Chromium, set PLAYWRIGHT_CHROMIUM_EXECUTABLE as above. Tests use local fixtures and do not need merchant/email/database credentials. The fixture server refuses production/Vercel execution and is excluded from deployment source.

## Hosted PostgreSQL attempts

Hosted migration and 19-statement idempotence replay succeeded on isolated Neon branch `br-calm-rice-b7mcxqw7`; all 16 commerce tables exist. API suites did not reach assertions: direct TCP timed out and WebSocket setup returned a network/non-101 error. Each final attempt reports **0 passed, 16 failed, 0 skipped**; see qa/commerce-hosted-tcp-failure.log and qa/commerce-hosted-postgres.log. These are unresolved external connectivity failures, reported separately from the 40 passing local tests. The added last-unit contention test passes locally; PGlite serialization does not prove hosted multi-connection behavior.

CI for implementation commit cc5860cd585670f56fd7b623154716f649a4a11b passed: https://github.com/tmohoboko/royalpriesthood/actions/runs/40484438035 . Subsequent database-test evidence changes require their own CI result.

## Resumed release execution

Reran npm run check (10 unit +16 API tests, lint/build pass), npm test (7 pass), npm run test:commerce (7 pass), npm audit --omit=dev (zero vulnerabilities). Browser executable is the installed Chromium path above. Logs are qa/commerce-preview/check.log, regression.log, commerce-e2e.log and dependency-audit.log. Final implementation CI passed: https://github.com/tmohoboko/royalpriesthood/actions/runs/40487058707 .

Additional hosted Playwright smoke run: **21 assertions passed, 0 failed**, against the real protected Preview and Neon database. Covers direct routes, health/catalogue, registration/login/logout, secure cookie, session refresh, address persistence, empty order history, customer/admin separation, mobile overflow and browser errors. Exact executed script, results and screenshots are in qa/commerce-preview/. This is separate from the 40 local tests, whose gateway/email calls remain mocked. No real sandbox payment or inbox receipt was executed.

Reran optional COMMERCE_HOSTED_TEST=1 integration suite from this machine: **0 passed /16 failed /0 skipped**, all before-hook ETIMEDOUT connection failures. Hosted API connectivity is independently confirmed through Vercel, but hosted stock-contention/load verification remains outstanding. The earlier note that preview was blocked by team access is historical; access and deployment are now restored. Checkout acceptance is blocked by actual catalogue, merchant/email credentials and externally accessible callback configuration.

## Payment-gate execution

**43 local tests passed /0 failed /0 skipped** (12 unit,17 API,7 original browser,7 commerce browser), lint/build passed, dependency audit zero vulnerabilities. **12 live assertions passed**, including public callback boundary, invalid-signature rejection, paid database evidence, cancelled order safety and storefront protection. One initial browser run collided with a parallel build deleting dist (2 passed/5 failed); serialized rerun passed all seven. Valid duplicate notification, FAILED status, signed wrong merchant, unknown payment reference, amount mismatch and unsupported status were exercised through automated gateway HTTP/DNS mocks. No second real provider notification or real FAILED provider event is claimed. Actual invalid-signature replays returned HTTP400 and left one paid event/one receipt.

Evidence: qa/payment-gate/gate-result.json, database-final.json, provider-outcome.json, live-assertions.json, order-evidence.json, screenshots and suite logs. The queued receipt has sent_at NULL and zero delivery attempts; **RESEND_API_KEY and verified EMAIL_FROM** remain required for app email acceptance. PayFast's own success-screen receipt message is not evidence of application email or inbox delivery.

Commands: npm run check; npm test; npm run test:commerce; npm audit --omit=dev; node qa/payment-gate/assert-live-results.mjs. Run builds and browser suites sequentially because they share dist. Full logs are qa/payment-gate/check.log, storefront-regression.log, commerce-e2e.log and live-assertions.log. Live assertions consume the recorded database snapshot plus fresh endpoint responses. Real gateway submission/clicks used Playwright, without mocking PayFast or storing card data.
