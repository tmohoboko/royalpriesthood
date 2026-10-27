# Royal Priesthood Commerce v2 prototype closure

## Final decision: BLOCKED

Required acceptance case totals: **32 PASS /0 FAIL /2 BLOCKED /0 SKIPPED** (34 cases). The implemented customer purchase flow and actual PayFast sandbox success are verified. The two unresolved mandatory real-provider cases prevent a PASSED closure verdict: PAY-03 (real FAILED scenario) and PAY-05 (replay of a real validated provider notification). Mocked evidence is not counted as real PayFast evidence. There is no outstanding reproducible implementation defect in the executed cases.

## Repository and release

- Repository: tmohoboko/royalpriesthood; branch commerce/production-upgrade-20261027.
- Acceptance-start repository commit:51497d88ef604ce396698a5f8e9f0147c5034d91.
- Deployed implementation:7ec7a42c395b231a2dec028c1a2bd209f4d4dea4; subsequent commits contain tests/docs/evidence only. Final closure evidence commit is the commit containing this report and is supplied in final delivery.
- Existing Preview dpl_9xC2hhfPwJTNY5jtWZoZfMekZgFk: READY. Authorized tester URL https://royalpriesthood-commerce-preview-tmdev.vercel.app/ . Immutable URL https://royalpriesthood-4ojcibn9u-tmdev.vercel.app/ . Use stable origin for mutation forms.
- No application code change, rebuild of unrelated components or new deployment was required. Current implementation was built/tested, real routes and database exercised; READY alone was not treated as acceptance.
- Production domain still targets original dpl_9vFzqtHSBVXwgEZSv3cm1WZtoAzG. No production credentials, data, settings or promotion were used.

## Verified outcome

RP-QA-001, Royal Priesthood Test T-Shirt, Black/Medium, R100.00, initial stock5, shippingR0. Stable IDs make the fixture reusable without duplicate records or automatic stock refill. Old R5 fixture was deactivated while preserving its historical orders.

The customer UI performed catalogue → detail/variant → guest cart → authentication/cart merge → delivery → review → pending order → actual sandbox payment → verified confirmation → history. PayFast transaction **3479203** paid order **cd487f247e02f59753974bceddc3161be56ca5d8648fafaf**, amount10000 cents, one verified event, one queued receipt. Repeated checkout with the same key produced the same order and one reservation. A second actual gateway cancellation remained pending/unpaid with no receipt. Remaining stock3 correctly includes the held cancellation reservation; the browser cancel did not release potentially in-flight payment stock.

Customer admin access returned403; the operator-provisioned synthetic admin could access products/orders and the admin UI. Generated test credentials are private, ignored and not in this evidence package. All16 expected schema tables were observed; no pending migration was found for the current code.

Targeted regression executed: npm run check (lint,12unit,17API,build), npm run test:commerce (7pass), npm test (7pass), npm audit --omit=dev (0vulnerabilities). **43 tests passed,0failed,0skipped**. Live journey assertions passed after two recorded test-harness repairs. See acceptance-test-results.md for commands, expected/actual results and evidence references.

## Exact blocker and smallest next action

PayFast's documented sandbox provides only a funded wallet, makes payments successful and sends each notification once. A real FAILED scenario and real validated-notification replay were therefore not available. Controlled integration coverage for failure, valid replay, wrong amount, merchant/reference/status errors and inventory safety passed, but does not satisfy those mandatory real-provider cases.

**Highest-priority next action:** agree a provider-backed method for PAY-03/PAY-05, or explicitly waive those real-provider requirements in favor of the already labelled controlled tests. Do not make speculative code changes or test production to force these cases.

Application email delivery remains separately blocked by RESEND_API_KEY and verified EMAIL_FROM; the receipt is queued, not sent. Email is a future acceptance item, not hidden inside the payment verdict.

## Post-prototype backlog — not implemented in this session

- Commercial requirements and business analysis.
- Production merchant onboarding and separate live verification.
- Verified transactional email integration.
- Approved catalogue and pricing.
- Fulfillment and shipping operations.
- Customer service.
- Commercial inventory management and reservation reconciliation operations.
- Security and compliance review.
- Commercial launch planning.
- Multi-tenant platform strategy.

This report closes the controlled execution cycle with documented external blockers. It does not authorize a commercial launch.
