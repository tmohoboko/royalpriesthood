# RP-V2.1 requirement-to-test traceability

Prepared before implementation. Starting SHA: `2843d2422d479dcc92507dc8ea4a317157558c23`. Prompt/change request: RP-V2.1. Test suite: RP-V2.1-1.

Work Item | Acceptance Criterion | Test Scenario | Test Case | Automation Level | Evidence
---|---|---|---|---|---
WI-01 | AC05 | Shared homepage/Shop shell | SMK-01 | browser | Pending execution; results in sibling reports
WI-01 | AC01,AC02,AC04 | Wishlist and Cart; no Enquiry | SMK-02 | browser | Pending execution; results in sibling reports
WI-02 | AC01,AC02,AC03,AC04 | Approved cards and purchase eligibility | SMK-03 | browser/API | Pending execution; results in sibling reports
WI-02 | AC01,AC05 | Save/toggle unique variant | SMK-04 | browser/API | Pending execution; results in sibling reports
WI-03 | AC01 | Drawer product/variant accuracy | SMK-05 | browser | Pending execution; results in sibling reports
WI-03 | AC02 | Remove and confirm clear | SMK-06 | browser/API | Pending execution; results in sibling reports
WI-03 | AC03,AC04 | Refresh/navigation/login deduplication | SMK-07 | browser/API | Pending execution; results in sibling reports
WI-03 | AC05 | Atomic validated move, preserve unavailable | SMK-08 | browser/API | Pending execution; results in sibling reports
WI-04 | cart | Authoritative cart totals | SMK-09 | browser/API | Pending execution; results in sibling reports
WI-04 | inventory | Update/reject unavailable/recover inventory | SMK-10 | API | Pending execution; results in sibling reports
WI-04 | auth | Guest cart merge/login failures | SMK-11 | browser/API | Pending execution; results in sibling reports
WI-04 | pending | One idempotent pending order | SMK-12 | API/browser | Pending execution; results in sibling reports
WI-04 | sandbox-init | Sandbox endpoint/merchant/reference/amount | SMK-13 | unit/API | Pending execution; results in sibling reports
WI-04 | provider | Genuine provider sandbox transaction | SMK-14 | hosted manual | Pending execution; results in sibling reports
WI-04 | verified-itn | Genuine verified ITN exactly once | SMK-15 | hosted/provider | Pending execution; results in sibling reports
WI-04 | receipt | Confirmation, queued/sent/failed accuracy | SMK-16 | API/browser/provider | Pending execution; results in sibling reports
WI-04 | history | Customer-owned order history | SMK-17 | API/browser | Pending execution; results in sibling reports
WI-04 | negative-payment | Cancel/invalid signatures/duplicate callbacks | SMK-18 | unit/API/browser | Pending execution; results in sibling reports

Extended cases: EXT-W01 ownership/forged item IDs (WI-03-AC06, WI-05); EXT-W02 mismatched variants and unpriced products (WI-02-AC03, WI-03-AC05); EXT-W03 concurrent/deduplicated merge (WI-03-AC04); EXT-W04 mobile focus trap/Escape/direct navigation (WI-01-AC05, WI-03 accessibility); existing unit/API/browser suites cover price manipulation, inventory recovery, callback idempotency, authentication failures and history. Genuine provider acceptance must remain separate from fixtures.
