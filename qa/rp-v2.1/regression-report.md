# RP-V2.1 regression

Starting baseline verified clean at 2843d2422d479dcc92507dc8ea4a317157558c23 on commerce/production-upgrade-20261027. No catalogue asset or styling rewrite.

Lint, 14 unit tests and 19 integration tests pass (check.log). Local integration database is PGlite. Tests include price manipulation, invalid signature, duplicate notification, failed/cancelled payment, inventory release, pending-order idempotency, auth denial, cross-user history isolation and receipt retry. Genuine provider acceptance is recorded separately.

Initial browser run: 16 passed / 3 failed. Two legacy receipt-label expectations were updated to explicit mapped status; Wishlist DELETE's missing JSON content type was fixed. Complete corrected rerun: 19 passed / 0 failed. Final regression after server cart summary and open-Cart synchronization checks: 19/19 commerce browser and 6/6 storefront browser PASS. Overall 58 automated checks PASS (14 unit + 19 API/integration + 25 browser). Lint/build PASS. Original baseline artifacts were preserved; current outputs are under regression-artifacts/. Hosted acceptance is separate.

Direct TCP/WebSocket access to Neon failed from this execution environment. Connected Neon SQL succeeded; the isolated Preview migration and runtime permissions were checked through that service. Hosted browser/API checks exercise deployed pg connectivity.
