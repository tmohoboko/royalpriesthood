# RP-V2.1.1 requirements-to-test derivation

Prepared before implementation. Starting HEAD eed3b6fca54079948088e61ae130d3ac13d7a4aa. Suite RP211-1; fixture set RP211-UAT-1. No predetermined extra test count. All21 required smoke cases will carry preconditions/actions/expected/actual/status/evidence/commit/deployment in smoke-results.json.

Test | Work item | Requirement/scenario | Level | Evidence
---|---|---|---|---
SMK-211-01 | RP-211-01 | Homepage/shared design | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-02 | RP-211-01 | One Shop/no Catalogue navigation | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-03 | RP-211-01 | Legacy URL/hash access | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-04 | RP-211-01,04 | Approved identities/images/categories | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-05 | RP-211-03 | Wishlist persistence and counters | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-06 | RP-211-03,04 | Available variant to Cart | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-07 | RP-211-02,03 | Authoritative Cart totals | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-08 | RP-211-03 | Rejected quantity preserves Cart | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-09 | RP-211-02 | Optional blank/whitespace discount | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-10 | RP-211-02 | Invalid code inline, no order | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-11 | RP-211-03 | Login merge and account isolation | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-12 | RP-211-02,03,04 | Correct pending order/reservation | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-13 | RP-211-03,04 | Sandbox initiation/reference/amount | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-14 | RP-211-03,04 | Genuine verified provider success | hosted browser/API/SQL + genuine provider | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-15 | RP-211-03 | Confirmation/history/receipt queue | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-16 | RP-211-03 | Unverified/cancelled/failed/tampered safety | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-17 | RP-211-04 | Isolated PostgreSQL fixture records | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-18 | RP-211-04 | SQL/API/UI values agree | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-19 | RP-211-04 | Multi-category/variant Cart actions | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-20 | RP-211-02,03,04 | Tampered price/stock rejected | hosted browser/API/SQL | PASS: smoke-results.json / frontend-smoke-results.md
SMK-211-21 | RP-211-03,04 | One reservation/paid confirmation; no duplicate deduction | hosted browser/API/SQL + genuine provider | PASS: smoke-results.json / frontend-smoke-results.md

Affected regressions: canonical redirects/department navigation, literal and whitespace blank discounts, inline invalid codes, valid existing discount, wishlist/login/cart/history, current inventory after mutation, tampered prices, last-unit contention, valid duplicate callback and receipt dedup. Seed coverage: replay retains stock; reverse deactivates only owned fixture rows and preserves order references; non-preview fixture purchase rejected. Controlled gateway tests remain explicitly separate from genuine provider acceptance.


All21 mandatory cases PASS on implementation `5a5113e33287e150d1632d88e4ad06b6ad95763a`, deployment `dpl_3deczHMQtCM7tM8nyof5rCR2mLkj`. Final per-case work-item linkage, preconditions/actions/expected/actual/evidence are in smoke-results.json.

Work item | Implementation | Acceptance evidence
---|---|---
RP-211-01 | src/StorefrontShell.jsx, src/navigation.js, src/main.jsx, src/Commerce.jsx, vercel.json | SMK-211-01–04; canonical regression; all16 references retained
RP-211-02 | src/Commerce.jsx, server/handler.js, server/service.js | SMK-211-07,09,10,12,20; baseline whitespace failure and passing-after inline/valid-code tests
RP-211-03 | src/main.jsx, src/Commerce.jsx, src/Wishlist.jsx; existing locked reservation/payment service preserved | SMK-211-05–08,11–16,20,21; stale-tab-before-after.json; final-check.log
RP-211-04 | migrations/003-uat-catalogue.sql, scripts/commerce-uat211*, server/uat-policy.js, server/handler.js, server/service.js, src/CatalogueCard.jsx | SMK-211-04,06,12–14,17–21; seed replay/reverse and SQL/API/UI snapshots

Every listed runtime file matches the uploaded committed source. No application-source changes followed the implementation commit.
