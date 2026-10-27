# Wishlist functional acceptance

Suite RP-V2.1-1 derives from WI-01/02/03/05; see requirements-traceability.md. Source tests: tests/integration/commerce.test.js (two Wishlist contract cases) and tests/commerce/wishlist.spec.js (two browser journeys), plus updated existing storefront/frontend tests.

API coverage: persisted unique product/variant entries; validated product ownership of variant; unknown products; cross-customer deletion/move denial; guest-to-customer merge without duplicates; logout isolation; rejected unpriced/out-of-stock moves preserve entries; successful atomic move increments Cart and removes saved item; replay cannot move twice.

Browser coverage: shared Wishlist count across navigation/reload; approved product/variant display; remove; explicit clear confirmation and cancellation; mobile focus trap, Escape and focus return; confirmed Cart and open Cart list synchronization. Preferred quantity is stored by API; drawer displays it without adding unsupported quantity editing.

Local API and browser cases PASS; see check.log and browser-commerce.log. Hosted run uses real Preview persistence and no provider mocks; local purchase suites use explicit test-only database/payment/email fixtures.

Hosted Wishlist acceptance PASS, including real persistence and guest/customer merge, cross-session denial, eligible move and confirmed shared counters. Authenticated customer/customer denial and inventory changes after save also PASS in final integration run. See hosted-smoke.json and integration-ownership-stock-final.log. All WI-01/02/03/05 acceptance criteria pass within the sandbox scope.
