# Executed test matrix — 2026-10-27

Final local result: **39 passed, 0 failed, 0 skipped** across the four automated suites. Lint and Vite production build passed. Production dependency audit: see `qa/commerce-audit.log`. No TypeScript configuration existed; no TypeScript type-check was performed or claimed. ESLint validates JavaScript, React hook placement and module syntax; Zod validates server inputs. Full static type coverage remains an explicit limitation.

| Suite/command | Passed | Failed | Skipped | Evidence |
|---|---:|---:|---:|---|
| npm run test:unit | 10 | 0 | 0 | qa/commerce-check.log |
| npm run test:integration | 15 | 0 | 0 | qa/commerce-check.log |
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
