# RP-V2.1 hosted smoke results

Preview: https://royalpriesthood-commerce-preview-tmdev.vercel.app/

Deployment: `dpl_GssRABAMmYXbJB4sHFPSaA8Ep5om`; implementation: `d44eeecfacb864b1b13265f5c1dd79935d226fae`. Source identity is proven by the live commit report and all 35 uploaded application/config/migration/script file digests matching Git. The inherited post-build aggregate fingerprint mismatch is recorded separately.

**18 PASS / 0 FAIL / 0 BLOCKED / 0 SKIPPED.** Four additional hosted checks PASS.

Case | Status | Executed evidence
---|---|---
SMK-01 | PASS | Homepage and Shop share one approved shell and catalogue
SMK-02 | PASS | Wishlist and Cart present; Enquiry absent
SMK-03 | PASS | Approved imagery; configured R100 test variant only; unpriced products have no Cart action
SMK-04 | PASS | Save updates unique-entry counter
SMK-05 | PASS | Drawer displays saved approved product and pending availability
SMK-06 | PASS | Removal persisted and header decremented
SMK-07 | PASS | Refresh/navigation persistence; login merges duplicate guest entry once
SMK-08 | PASS | Move revalidates current variant/stock and updates open Cart and counter
SMK-09 | PASS | Server-calculated cart subtotal, shipping estimate and grand total
SMK-10 | PASS | Unavailable quantity rejected; valid quantity recovers
SMK-11 | PASS | Registration preserves guest Cart
SMK-12 | PASS | Persisted PENDING order R100 before payment
SMK-13 | PASS | Real sandbox endpoint, merchant configured, reference and R100 amount; credentials omitted
SMK-14 | PASS | Genuine PayFast wallet transaction 3479473 recorded; no synthetic callback
SMK-15 | PASS | Backend verified provider notification and persisted PAID R100 order; exact-once event count corroborated by SQL evidence
SMK-16 | PASS | One receipt generated and queued; email delivery unconfigured and unclaimed
SMK-17 | PASS | Authenticated customer owns paid order and sees it in history
SMK-18 | PASS | Two actual invalid-signature callback replays rejected; no duplicate receipt or payment regression

Scripts: hosted-acceptance.mjs, provider-acceptance.mjs, confirmation-acceptance.mjs. Raw results: hosted-smoke.json, payment-confirmation.json and payment-database-evidence.json. Actual email delivery is a separate unexecuted external acceptance item; SMK-16 verifies honest queued receipt status.

Initial harness attempts stopped on ambiguous status and overly exact Province selectors. Application behavior was unchanged by those corrections. No pending order/payment was produced by the failed attempts. The final run completed all cases.
