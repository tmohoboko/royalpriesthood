# Royal Priesthood catalogue

Current React/Vite storefront recovered from existing tmdev deployment dpl_2F5UNVdmDhG3uStLuNSPCxM1HM63. The earlier tea-party programme is preserved in royal_priesthood_interactive_programme.html; do not deploy it over the storefront.

Run npm ci, npm run build and npm test. Browser tests support PLAYWRIGHT_CHROMIUM_EXECUTABLE for an installed Chromium.

16 current catalogue looks; Men, Women, T-Shirts, Pants, Shoes and Hats filters. Pants and shoes are part of styled looks. Enquiries only: no fabricated pricing, stock or paid orders. VITE_CONTACT_EMAIL is the optional public enquiry recipient; without approved contact details the complete brief can be copied/downloaded for sending.

Catalogue originals are preserved alongside responsive 480/960/1600 WebP derivatives. Approved source folder Royal_Priesthood_18_Pictures was used to restore interrupted artifact downloads; pixel comparison of White Minimal against the full hosted original was exact (RMSE 0).

Release evidence: qa/evidence/2026-10-22/. Existing project prj_IZuPhIVC8rI7nLzV1SdJifoaQaRp, tmdev. Never create a replacement hosting project.

## Commerce upgrade (sandbox only)

The editorial enquiry experience is preserved. `/shop` adds customer accounts, a database-backed shopping cart, checkout, order history and administration. It requires a configured PostgreSQL database; the deployed API never falls back to local fixtures. Products seeded from the catalogue are inactive until actual saleable contents, prices and stock are approved. No live payment processing is enabled.

Run `npm run check`, `npm test` and `npm run test:commerce`. `npm run dev:commerce` serves the normal local app and backend using ignored `.env` configuration; `vite preview` alone does not run the backend. `npm run db:migrate` applies the additive commerce schema. For automated local fixtures, build first and launch `node scripts/commerce-test-server.mjs` (loopback only, gateway/email mocked).

Start with [deployment and acceptance instructions](docs/commerce-deployment.md), [requirements](docs/commerce-requirements.md), [architecture](docs/commerce-architecture.md), [API](docs/commerce-api.md), [test matrix](docs/commerce-test-matrix.md) and [release report](docs/commerce-release-report.md). Do not use the older production release script for commerce previews. Production promotion needs separate approval.
