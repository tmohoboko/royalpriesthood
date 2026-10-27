# RP-V2.1 defects

ID | Requirement | Finding | Resolution/status
---|---|---|---
D-01 | WI-03-AC02 | Initial browser run: DELETE omitted JSON content type required by existing API; removal returned 415. | Fixed Wishlist client headers; 19/19 browser rerun PASS.
D-02 | WI-04 receipt | Existing browser expectation used `sent`; UI now uses explicit RECEIPT_SENT mapping. | Updated assertion; provider delivery remains distinct.
D-03 | WI-02/03 global state | Move from drawer on an already-open Cart could leave the line list stale despite header count. | Shared confirmed cart snapshot synchronizes Commerce; open-Cart browser regression PASS.
D-04 | WI-04 receipt delivery | Preview has no RESEND_API_KEY/EMAIL_FROM. | Open: queue generation can be verified; actual delivery blocked.
D-05 | WI-04 cart-stock | Previously reported issue not yet reproduced; existing API stock validation tests pass. | Continue hosted stock rejection/recovery acceptance.
