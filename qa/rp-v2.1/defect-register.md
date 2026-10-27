# RP-V2.1 defects

ID | Requirement | Finding | Resolution/status
---|---|---|---
D-01 | WI-03-AC02 | Initial browser run: DELETE omitted JSON content type required by existing API; removal returned 415. | Fixed Wishlist client headers; 19/19 browser rerun PASS.
D-02 | WI-04 receipt | Existing browser expectation used `sent`; UI now uses explicit RECEIPT_SENT mapping. | Updated assertion; provider delivery remains distinct.
D-03 | WI-02/03 global state | Move from drawer on an already-open Cart could leave the line list stale despite header count. | Shared confirmed cart snapshot synchronizes Commerce; open-Cart browser regression PASS.
D-04 | WI-04 receipt delivery | Preview has no RESEND_API_KEY/EMAIL_FROM. | Open: queue generation can be verified; actual delivery blocked.
D-05 | WI-04 cart-stock | Previously reported issue not reproduced; local and hosted API stock rejection and recovery pass. | Closed as not reproducible on this baseline.

D-06 (release diagnostic, inherited): post-build aggregate fingerprint differs; all 35 uploaded application/config/migration/script files independently match implementation Git SHA and live commit report. Source identity PASS via uploaded-source verification; aggregate mismatch remains open as a nonblocking diagnostic limitation.

Hosted harness corrections: scoped Add-to-Cart status locator after Wishlist also displayed a status; removed overly strict exact Province label matching (existing browser suite already uses partial label). Neither changed application source. Failed harness attempt retained separately.
