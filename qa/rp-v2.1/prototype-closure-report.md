# RP-V2.1 closure report

**Sandbox release candidate accepted with documented limitations. No production promotion or live payment activation.**

Work item | Acceptance | Implementation/evidence
---|---|---
WI-01 shared header | PASS all five criteria | Shared Wishlist/Cart, Enquiry removed, navigation/style preserved; hosted smoke and FE suite
WI-02 shared product card | PASS all five criteria | Same approved images and shared card; unique product/variant Wishlist, eligible Cart, pending-pricing guard
WI-03 Wishlist drawer | PASS all six criteria | Persisted guest/customer entries, deduplicated merge, owned deletes/moves, confirmed clear, stock revalidation, mobile/keyboard
WI-04 purchase journey | PASS sandbox flow and honest receipt state | Genuine R100 payment/verified ITN, confirmation/history, queued receipt; external email delivery blocked separately
WI-05 persistence/API | PASS | Additive owned Wishlist table, unique entries/timestamps/quantity, existing API/session/Cart integration; historical Enquiry storage untouched

Starting Git SHA: `2843d2422d479dcc92507dc8ea4a317157558c23`.
Ending implementation SHA: `d44eeecfacb864b1b13265f5c1dd79935d226fae`.
Final evidence/test commit is the commit identified by local annotated tag `v2.1.0-rc.1`; application source is unchanged from the deployed implementation. No branch/tag push or production release is implied.

Preview: https://royalpriesthood-commerce-preview-tmdev.vercel.app/
Immutable Preview: https://royalpriesthood-3y2un7yq1-tmdev.vercel.app/
Deployment: `dpl_GssRABAMmYXbJB4sHFPSaA8Ep5om`, READY, Preview.
Identity: live reported commit and all35 uploaded application/config/migration/script file digests match committed implementation. The inherited post-build workspace aggregate hash difference remains a separate diagnostic limitation; it was not reported as matching.

Hosted smoke: **18 PASS /0 FAIL /0 BLOCKED /0 SKIPPED**. Local regression: **58 PASS** (14 unit,19 integration/API,25 browser); hosted frontend regression: **10 PASS**. Four additional hosted assertions pass. Final ownership/changed-stock integration run also passes19 cases; repeated runs are not counted as new tests. Lint/build PASS. No TypeScript checking is claimed for this JavaScript repository.

Genuine sandbox evidence: order `d447327199754c8aba9462b250dd2b39c8734075668cc851`, payment `c9fabdc39afa45421a2df14f3ba0077b2fb9246b44e2324d`, PayFast transaction **3479473**, **R100.00**, order/payment PAID, exactly one verified payment event and one receipt. Two actual invalid-signature replays rejected400 BAD_SIGNATURE; final event/receipt counts unchanged. Browser redirect was not used as payment proof. Duplicate-valid, failed/cancelled provider and email send scenarios remain explicitly labelled local fixtures, not genuine additional transactions.

Receipt generation: PASS, one `pending` notification → RECEIPT_QUEUED; sent_at null. Delivery: BLOCKED/unconfigured (no RESEND_API_KEY/verified EMAIL_FROM); no claim of send or mailbox delivery. The existing `sent` model denotes provider acceptance; actual delivery requires separate provider/mailbox evidence.

Open defects/risks: D-04 absent receipt-email configuration; D-06 inherited aggregate fingerprint diagnostic. D-01 DELETE header and D-03 open-Cart synchronization defects were fixed and rerun; D-02 receipt assertion updated; D-05 stock issue not reproduced in local/hosted rejection/recovery checks. Direct TCP/WebSocket access from the runner failed; connected Neon SQL and hosted application connectivity succeeded. The single paid sandbox order and synthetic QA accounts/carts remain as evidence on the isolated Preview branch; existing test stock is two. No physical fulfilment requested. Approved nonconfigured catalogue products remain pending pricing/availability and cannot enter checkout.

Production before/after: `dpl_9vFzqtHSBVXwgEZSv3cm1WZtoAzG`. Only the canonical Preview and guarded sandbox callback aliases were updated. Existing protection and sandbox-only payment guard remain in force.

Release verdict: **v2.1.0-rc.1 accepted for sandbox/UAT with the above limitations; this does not authorize production.** The smoke receipt gate checks the required truthful supported state; actual email delivery was conditional in the request and is explicitly left as separate acceptance.

Single next action: configure a verified receipt-email sender and verify actual provider/mailbox delivery.

Evidence index: requirements-traceability.md; wishlist-functional-tests.md; frontend-smoke-results.md; payment-sandbox-results.md; regression-report.md; ui-acceptance-screenshots/; release-manifest.json; defect-register.md. Raw scripts/results and uploaded source digests are adjacent. Original baseline evidence was preserved.
