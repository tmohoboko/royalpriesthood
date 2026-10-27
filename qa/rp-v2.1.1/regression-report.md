# RP-V2.1.1 regression results

Implementation: 5a5113e33287e150d1632d88e4ad06b6ad95763a. Deployment: dpl_3deczHMQtCM7tM8nyof5rCR2mLkj. Suite RP211-1; fixture version RP211-UAT-1.

Suite | Passed | Failed | Evidence
---|---:|---:|---
Unit |15|0|check.log
API/integration (PGlite SQL) |24|0|check.log
Commerce browser |21|0|browser-commerce.log
Original storefront browser |6|0|browser-storefront.log
Hosted frontend (real Preview/API/Neon) |10|0|hosted-frontend-results.json;hosted-frontend.log

**76 distinct regression cases PASS;0 FAIL.** Lint/build PASS. Existing v2.1 Wishlist, guest/cart merge, quantity/stock guard, authentication, checkout, payment negative/idempotency, receipt retry and order history tests were preserved and rerun. Legacy homepage catalogue tests now enter the homepage directly; dedicated cases verify the new canonical redirect contract. No image/design rewrite.

Failing-before: whitespace-only discount returns400 and duplicate Catalogue nav appears (failing-before-discount.log, failing-before-navigation.log). Passing-after: same discount assertion in integration suite and browser stabilization case; navigation legacy/department case PASS. Stale inventory snapshot is verified through a held-open product tab during hosted reservation/payment, plus refreshed authoritative API/UI comparison. The original stock0 condition is correct and was not masked by a restock.

Seed coverage: isolated PostgreSQL execution, replay, reverse/reapply and original-row comparison are recorded independently. Embedded SQL regression verifies consumed stock is not reset, collisions reject atomically, and reverse retains variant references. API tests hide/reject UAT products outside sandbox Preview/test. Existing last-unit contention and explicit COMPLETE replay tests pass locally; PGlite serialization is not a hosted database load test.

Valid/invalid gateway signatures, valid duplicate callbacks, verified cancellation/failure, receipt send/retry and local browser purchase journeys use labelled test-only HTTP/DNS/email fixtures. Genuine wallet transaction/verified callback evidence is separate in payment-sandbox-results.md. No mocked outcome is reported as genuine. Actual receipt email delivery requires separate provider evidence.

Full hosted21-case mandatory smoke certification is recorded separately in smoke-results.json; do not infer it from the76 regression cases. The initial hosted test harness attempt failed before reaching checkout due to an omitted tester header; its15 PASS/1 FAIL/5 BLOCKED results are retained, not certified. Final source identity uses all41 uploaded-file digests and the live commit; inherited aggregate fingerprint limitation remains documented.

Final exact-commit verification: final-check.log, final-browser-commerce.log and final-browser-storefront.log repeat the scoped suites after commit, on the same5a5113e source uploaded to Preview. Counts remain15 unit/24 API/21 commerce-browser/6 storefront-browser, plus10 hosted frontend=76 distinct cases. Repeated runs are not counted as additional cases.

Live stale regression also reproduces the defect against d44eeec immutable Preview:display5 versus actual4 after focus. Fixed5a5113e displays4 on focus; safe uninitiated cancellation restores5. See stale-tab-before-after.json and paired screenshots. Hosted smoke finally21 PASS/0 FAIL/0 BLOCKED; PostgreSQL independently confirms one genuine verified event/receipt and59 total synthetic available units after one genuine purchase.
