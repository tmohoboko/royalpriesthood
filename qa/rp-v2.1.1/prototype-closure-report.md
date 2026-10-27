# Royal Priesthood Commerce v2.1.1 closure

**Release verdict: ACCEPTED WITH LIMITATIONS, Preview only.** All four work-item acceptance conditions pass. Local tag v2.1.1-rc.1 identifies the final evidence/test commit; application source is unchanged from deployed implementation. No production deployment, promotion, commercial price overwrite or stock replenishment.

Starting SHA: eed3b6fca54079948088e61ae130d3ac13d7a4aa. Implementation SHA: 5a5113e33287e150d1632d88e4ad06b6ad95763a. Final evidence SHA resolves from v2.1.1-rc.1^{commit}. Initial working tree was clean; fetched origin was two commits behind local HEAD. Canonical baseline used d44eeec implementation intentionally followed by evidence-only eed3b6f.

Preview: https://royalpriesthood-commerce-preview-tmdev.vercel.app/
Immutable Preview: https://royalpriesthood-1u6ed18te-tmdev.vercel.app/
Deployment ID: dpl_3deczHMQtCM7tM8nyof5rCR2mLkj, READY. Live commit and all41 uploaded application/config/migration/script file digests match the implementation. Final evidence changes affect QA/docs only. Post-build aggregate fingerprint mismatch is inherited and explicitly not used as source proof.

Work item | Root cause | Changed components / acceptance
---|---|---
RP-211-01 | Duplicate Catalogue/Shop links; no canonical legacy path | Shared header, navigation helper/main, Vercel redirects and category query initialization. One Shop, legacy links and Women/Men journeys PASS.
RP-211-02 | Whitespace not normalized; optional label/inline feedback absent | Commerce field/review; authoritative quote/checkout normalization. Empty/whitespace, invalid inline/no-order, existing valid discount PASS.
RP-211-03 | Snapshot can be stale; original stock0 is legitimate after reservations/payments | Focus/mutation/paid refresh, existing locked reservation/ITN contract preserved. Original final2 units were consumed by later paid order59ed885... transaction3479492. No original restock. Stale old display5 vs backend4 reproduced, fixed focus4, safe cancellation restored5. Oversell/tamper/duplicate checks PASS.
RP-211-04 | Approved references intentionally inactive/unconfigured; no representative PostgreSQL UAT set | Additive003 metadata, guarded SQL seed/reverse runner, sandbox-only service policy and explicit card labels. Five category fixtures/ten synthetic variants; replay/reversal and purchase PASS. Original18 rows unchanged.

Database:23 product records,16 original approved references,5 new synthetic UAT fixture products,10 new variants (12 total),22 public Shop cards. Original16 references stay pending approved production pricing. SQL/API/UI compare all10 fixture variants, with final selected L/Gold T-shirt priceR110/stock5. Snapshot and reconciliation evidence are separate from UI assumptions. Initial60 synthetic available units are59 after one genuine purchase. R100 legacy stock remains0.

Mandatory hosted smoke: **21/21 PASS,0 FAIL,0 BLOCKED**, all executed on this candidate. Each case includes work item/requirement, preconditions/actions, expected/actual result, status/evidence, commit and deployment. Regression: **76 PASS,0 FAIL** (15 unit+24 API/integration+21 commerce browser+6 original browser+10 hosted frontend), lint/build PASS. Final exact-commit suite reruns pass; repeats are not counted as extra cases. Original v2.1 evidence was preserved.

Genuine provider: PayFast sandbox wallet transaction **3479543**, **R110.00**, order a9383659c0a91752d67fa96a35c0d48ae1509caec73d136e, payment 35ad83cfa02f458516c4ad6577b3e7d7c2a28e5ab76dbe39. Actual Complete Payment action and provider success observed; independent SQL confirms one verified event, PAID order/payment and one queued receipt. Available stock6→5 at pending reservation and stays5 after payment; no second deduction. Three actual tampered status posts failed400 before payment; browser return did not assert PAID. Valid duplicates, verified failed/cancelled and email send/retry scenarios use labelled controlled fixtures. No additional genuine negative transaction is claimed.

Receipt status: RECEIPT_QUEUED, sent_at null. No application send/mailbox-delivery claim. PayFast's shared-test-account receipt message is not application delivery proof.

Initial hosted harness attempt15 PASS/1 FAIL/5 BLOCKED is retained. An intercepted tampered checkout request omitted the tester header, so Vercel rejected it before any order/reservation. Corrected harness and full final rerun passed; application source did not change. The initial embedded migration prepared-statement issue was corrected to one additive ALTER; all final SQL tests pass.

Remaining accepted limitations: production commercial configuration pending for originals; legacy initiated reservations require reconciliation; actual receipt-email delivery unconfigured; inherited aggregate diagnostic mismatch; no hosted load-certification claim. No unresolved acceptance defect in the four approved work items. One paid synthetic order and one safely cancelled/uninitiated recovery order plus synthetic accounts/carts remain on the isolated branch as evidence; no physical fulfilment requested.

Production remains dpl_9vFzqtHSBVXwgEZSv3cm1WZtoAzG. Only canonical Preview and its guarded sandbox ITN alias were updated. Tag is local; no remote release publication is implied.

Recommended next action: perform owner UAT on the five documented synthetic fixture products in Preview.

Evidence index: root-cause-analysis.md; defect-register.md; requirements-traceability.md; smoke-results.json; frontend-smoke-results.md; regression-report.md; payment-sandbox-results.md; release-manifest.json; PostgreSQL/seed/reconciliation JSON; paired before/after screenshots and major UAT states. Seed/reverse instructions: docs/commerce-v2.1.1.md.
