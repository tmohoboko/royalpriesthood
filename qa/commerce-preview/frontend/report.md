# RP-FE-001 / RP-FE-002 — bounded frontend repair

Starting branch: commerce/production-upgrade-20261027. Starting HEAD:d08c8afdf133ab4bb6a7f397b7d26d51cc6e146e; working tree clean. Baseline deployed implementation7ec7a42, deploymentdpl_9xC2hhfPwJTNY5jtWZoZfMekZgFk.

Root cause RP-FE-001: all16 approved catalogue identities existed but were inactive/no variants/prices; the public active-only SQL filter hid them. Canonical src/catalogue.js now merges approved source identities/assets/tags with SQL purchasing eligibility. Approved references remain quote-required without invented pricing, variants or inventory. Configured active variants enable direct purchase; zero stock disables Add to Cart. Active extra products remain eligible, including the existing QA fixture. No database catalogue data or schema was changed.

Root cause RP-FE-002: a root pathname split rendered independent App and Commerce shells. StorefrontShell and CatalogueCard now reuse the original header/footer/Mark, product layout/images, typefaces and tokens. StorefrontContext connects shared catalogue, cart count/user and the original persistent enquiry bag. Commerce supplies route bodies only. Original responsive sections/artwork are retained; category tags including Pants/Shoes are catalogue groupings, not fabricated saleable variants. Accessories is now exposed as its existing department.

Local final results: **55passed/0failed/0skipped**:14unit,17API,10targeted frontend FE-001–010,7existing commerce browser,7original storefront browser. Lint, build and diff checks passed; production dependency audit zero vulnerabilities. Existing enquiry assertions retain persistence/download/focus coverage under the explicit Enquiry action. Gateway/email behavior in commerce regression uses the existing labelled mocks; no real payment was repeated for these frontend defects.

Executed: npm run check; npm run build; npm run lint; npm run test:commerce; npm test; npm audit --omit=dev (browser commands use the installed Chromium executable). Run build and browser suites sequentially. Logs are in this directory. Initial targeted failures and the shared-card status-announcement regression were repaired and rerun; see existing defect-register.md and retained attempt logs.

Implementation commit: **a3ca501203fa8cd63f0bc0f318f4cb7afeb3a465**. Ending evidence commit is supplied in final delivery; its changes are test/evidence/documentation only. Preview deployment: **dpl_4vRkuNZWnTeen5qNsbNyGEsfmJSW**, READY. Stable URL: https://royalpriesthood-commerce-preview-tmdev.vercel.app/ . Immutable URL: https://royalpriesthood-6at5s4kzw-tmdev.vercel.app/ . This was a clean committed CLI upload with explicit --target preview and per-build COMMERCE_COMMIT/metadata naming the exact SHA. Production settings/domains/payments remain untouched.

Hosted FE-001–010: **10passed/0failed/0skipped** using the actual Preview API/database and origin-scoped short-lived tester authentication, without merchant/email mocks. No checkout order or payment was created by hosted frontend tests; direct-purchase tests only update guest carts. Hosted API has17eligible entries:16approved quote-required references plus the existing RP-QA-001 direct-purchase fixture. The homepage and shop agree with that backend count. Desktop1440 and mobile375 screenshots are included.

The live commit report matches a3ca501. All33 uploaded application/config/migration files were compared against the committed source using the Vercel source archive's SHA1 digests; all match. The extra post-build aggregate fingerprint differed from local, so that aggregate was not used as source-identity proof; the uploaded-source comparison independently passes. Cause of the post-build workspace difference was not isolated in this bounded repair and is retained as a nonblocking build-diagnostic limitation. No metadata mismatch was hidden or described as matching.

Outstanding RP-FE-001/002 defects: **none**. All artwork/assets are unchanged. Approved looks remain quotes until owner-approved purchasing configuration exists. Earlier provider failure/replay and email acceptance items remain outside this frontend scope. These results do not constitute full application acceptance.

## Files and targeted test mapping

Exact changed paths are in files-changed.txt. Runtime: src/catalogue.js and server/handler.js resolve public eligibility; src/StorefrontShell.jsx, StorefrontContext.jsx and CatalogueCard.jsx reuse approved presentation/actions; main.jsx and Commerce.jsx mount one shell and share catalogue/cart/enquiry state; style.css/commerce.css use approved tokens and responsive layouts; data.js exposes the existing Accessories department. Build script/package changes provide non-secret commit diagnostics. Tests preserve previous behavior assertions while adding catalogue unit coverage and FE-001–010 browser coverage. No artwork, logos or database migrations changed.

| Case | Local | Hosted | Evidence |
|---|---|---|---|
| FE-001 all approved products | PASS | PASS | 16 approved IDs; all rendered |
| FE-002 API/UI eligible count | PASS | PASS | Hosted17 entries; same homepage/shop catalogue |
| FE-003 categories/variants/prices | PASS | PASS | Source tags preserved; explicit configured variants/prices only |
| FE-004 consistent styling | PASS | PASS | Shared black/gold header, Manrope/Cormorant and original card layout |
| FE-005 one shared header/navigation/footer | PASS | PASS | Shop/cart/account/checkout markup and links agree |
| FE-006 direct Add to Cart | PASS | PASS | Existing configured fixture only; stock respected |
| FE-007 quote Enquiry | PASS | PASS | Original drawer and persistence reused |
| FE-008 original catalogue cart integration | PASS | PASS | Header count and persisted cart update across navigation |
| FE-009 direct navigation/refresh | PASS | PASS | Shop/product/cart/account/checkout routes |
| FE-010 desktop/mobile | PASS | PASS | 1440/375 screenshots; no horizontal overflow; mobile menu usable |

Hosted command: FRONTEND_HOSTED=1 node --env-file=.env.local node_modules/@playwright/test/cli.js test --config=<temporary hosted config>. Hosted config uses tests/commerce/frontend.spec.js without a local webServer; screenshots/traces never contain authentication headers (traces off). All failed implementation/check attempts are recorded in the defect register and this directory's attempt logs.
