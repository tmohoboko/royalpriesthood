# Commerce requirements and audit

Audit 2026-10-27. Repository tmohoboko/royalpriesthood. Start 1afa03c; branch commerce/production-upgrade-20261027. Isolated worktree preserves other checkouts and untracked owner assets. Open GitHub issues: none returned by `gh issue list`. Existing local branches: main, release/storefront-20261022, release/catalogue-delivery-20261022. Latest remote catalogue commit 6d14e65 adds the approved original PNGs and earlier QA evidence; it was reviewed and fast-forwarded into the commerce branch before final validation. Main remains at 40c7e33.

Architecture: React 19, Vite 7, JavaScript ESM, Tailwind 4, src/main.jsx entry, hash section navigation. Vercel static SPA rewrite. No API, database, authentication, payment provider or email service. .env.example defines only public VITE_CONTACT_EMAIL; no relevant server credentials in runtime. Existing release script targets production: must not use for this assignment.

| Requirement | Baseline | Implementation target |
|---|---|---|
| Brand, catalogue, responsive images | Working | Preserve original files and editorial homepage |
| Search, categories | Working | Add server catalogue and sorting |
| Cart | Partial: local enquiry selection | Durable guest/customer cart, merge on login |
| Prices/stock/variants | Missing; looks are illustrative | Admin-configured saleable SKUs, no fabricated live stock |
| Accounts/profile/addresses | Missing | Hashed passwords, opaque database sessions, customer endpoints |
| Checkout/orders | Missing | Server totals, locked stock reservation, idempotency |
| Payments | Missing | PayFast sandbox adapter, verified ITN, fail closed |
| Email | Missing | Durable deduplicated outbox and configurable Resend adapter |
| Administration | Missing | Server role checks; products, variants, promotions, orders |
| Tests | 7 Playwright tests | Preserve regression suite; add unit, API, commerce browser flows |
| Deployment | Existing project/domain | Preview only, production approval separate |

Baseline: npm ci passed; npm run build passed (Vite 7.3.7). npm test executed: 0 passed, 7 failed at browser launch (missing chromium_headless_shell-1248); no application assertion ran. Browser installation and rerun required.

## Implemented result

The local commerce journey, role-protected administration, SQL schema/migration, PayFast sandbox adapter and notification outbox are implemented and covered by executed tests. Full external acceptance is not complete: hosted database configuration, approved product inventory/prices, merchant sandbox credentials/callbacks, email sender and Vercel team access are still required. Real sandbox transactions and a working hosted preview have not been demonstrated. Binary image uploads, gateway refund execution, unattended notification scheduling and comprehensive static typing remain partial/missing; see release report for exact scope.

Hosted database update: the existing Neon customer-testing project now has isolated child branch `commerce-upgrade-20261027` with the additive schema applied and replayed. Public catalogue remains inactive. See commerce-deployment.md for exact branch IDs and unresolved hosted runtime connectivity; no production database was changed.
