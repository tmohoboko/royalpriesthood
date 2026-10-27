# RP-V2.1 requirement-to-test traceability

Prepared before implementation. Starting SHA: `2843d2422d479dcc92507dc8ea4a317157558c23`. Prompt/change request: RP-V2.1. Test suite: RP-V2.1-1.

Work Item | Acceptance Criterion | Test Scenario | Test Case | Automation Level | Evidence
---|---|---|---|---|---
WI-01 | AC05 | Shared homepage/Shop shell | SMK-01 | browser | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-01 | AC01,AC02,AC04 | Wishlist and Cart; no Enquiry | SMK-02 | browser | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-02 | AC01,AC02,AC03,AC04 | Approved cards and purchase eligibility | SMK-03 | browser/API | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-02 | AC01,AC05 | Save/toggle unique variant | SMK-04 | browser/API | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-03 | AC01 | Drawer product/variant accuracy | SMK-05 | browser | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-03 | AC02 | Remove and confirm clear | SMK-06 | browser/API | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-03 | AC03,AC04 | Refresh/navigation/login deduplication | SMK-07 | browser/API | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-03 | AC05 | Atomic validated move, preserve unavailable | SMK-08 | browser/API | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-04 | cart | Authoritative cart totals | SMK-09 | browser/API | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-04 | inventory | Update/reject unavailable/recover inventory | SMK-10 | API | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-04 | auth | Guest cart merge/login failures | SMK-11 | browser/API | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-04 | pending | One idempotent pending order | SMK-12 | API/browser | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-04 | sandbox-init | Sandbox endpoint/merchant/reference/amount | SMK-13 | unit/API | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-04 | provider | Genuine provider sandbox transaction | SMK-14 | hosted manual | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-04 | verified-itn | Genuine verified ITN exactly once | SMK-15 | hosted/provider | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-04 | receipt | Confirmation, queued/sent/failed accuracy | SMK-16 | API/browser/provider | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-04 | history | Customer-owned order history | SMK-17 | API/browser | PASS; frontend-smoke-results.md and smoke-final-results.json
WI-04 | negative-payment | Cancel/invalid signatures/duplicate callbacks | SMK-18 | unit/API/browser | PASS; frontend-smoke-results.md and smoke-final-results.json

Extended cases: EXT-W01 ownership/forged item IDs (WI-03-AC06, WI-05); EXT-W02 mismatched variants and unpriced products (WI-02-AC03, WI-03-AC05); EXT-W03 deduplicated login merge (WI-03-AC04); EXT-W04 mobile focus trap/Escape/direct navigation (WI-01-AC05, WI-03 accessibility); existing unit/API/browser suites cover price manipulation, inventory recovery, callback idempotency, authentication failures and history. Genuine provider acceptance must remain separate from fixtures.


Final acceptance links (implementation d44eeecfacb864b1b13265f5c1dd79935d226fae):

Acceptance criterion | Test scenario / case | Automation | Evidence
---|---|---|---
WI-01-AC01 | Enquiry absent / SMK-02 | Hosted browser | hosted-smoke.json
WI-01-AC02 | Canonical drawer / SMK-05 | Hosted browser | hosted-mobile-wishlist.png
WI-01-AC03 | Add/remove counters / SMK-04,06 | Hosted browser | hosted-smoke.json
WI-01-AC04 | Cart remains functional / SMK-08,09,10 | Hosted browser/API | hosted-smoke.json
WI-01-AC05 | Shared shell/navigation/style/mobile / SMK-01, FE-004,005,010 | Local/hosted browser | hosted-frontend-results.json
WI-02-AC01 | Priced and unpriced Wishlist / SMK-03,04 | Hosted browser/API | hosted-smoke.json
WI-02-AC02 | Configured variants Cart / SMK-08,09 | Hosted browser/API | hosted-smoke.json
WI-02-AC03 | No unpriced paid checkout / EXT-W02, FE-003 | Local API/hosted browser | integration-ownership-stock-final.log; hosted-frontend-results.json
WI-02-AC04 | Single shared cards and valid actions / FE-001,002,003,005 | Local/hosted browser | hosted-frontend-results.json
WI-02-AC05 | Global confirmed counters / SMK-04,06,08 | Hosted browser | hosted-smoke.json
WI-03-AC01 | Product and selected variant / SMK-05,08 | Hosted browser | hosted-smoke.json; checkout screenshot
WI-03-AC02 | Persisted remove and confirmed clear / SMK-06; wishlist browser journey | Hosted/local browser/API | browser-commerce.log; hosted-smoke.json
WI-03-AC03 | Refresh/navigation persistence / SMK-07 | Hosted browser/API | hosted-smoke.json
WI-03-AC04 | Safe login merge, duplicates / SMK-07; EXT-W03 | Hosted/local API | hosted-smoke.json; integration-ownership-stock-final.log
WI-03-AC05 | Validate move against changed stock, preserve failure / SMK-08; EXT-W02 | Local/hosted API/browser | integration-ownership-stock-final.log; hosted-smoke.json
WI-03-AC06 | Guest/customer and customer/customer isolation / EXT-W01 | Hosted/local API | hosted-smoke.json; integration-ownership-stock-final.log
WI-04 cart/auth | Quantities, server totals, stock and auth / SMK-09,10,11 | Hosted browser/API | hosted-smoke.json; browser-commerce.log
WI-04 checkout/payment | Pending, initiation, genuine verified payment / SMK-12–15 | Hosted browser/provider/API/SQL | payment-sandbox-results.md; payment-database-evidence.json
WI-04 confirmation/history | Accurate receipt state and ownership / SMK-16,17 | Hosted browser/API/SQL | payment-confirmation.json; screenshots
WI-04 negative | Invalid signature, cancellation, duplicate callback, price manipulation / SMK-18 + existing integration | Hosted external POST; local controlled fixtures | payment-confirmation.json; check.log
WI-05 | Ownership, refs, quantity, timestamps, dedup and actual API routes | Local/hosted API/SQL | wishlist-functional-tests.md; docs/commerce-api.md; migrations/002-wishlist.sql

Runtime implementation files: src/StorefrontShell.jsx (WI-01), src/CatalogueCard.jsx and src/main.jsx (WI-01/02), src/Wishlist.jsx (WI-03), src/Commerce.jsx (WI-04), server/handler.js and server/service.js plus migrations/002-wishlist.sql (WI-03/05). Styling and catalogue assets are unchanged. Each runtime file matches the uploaded deployment source digest.
