# PayFast sandbox results — prototype closure

**Real successful payment: PASS. Full required payment-case set: BLOCKED.**

Preview: https://royalpriesthood-commerce-preview-tmdev.vercel.app/ . Immutable deployment https://royalpriesthood-4ojcibn9u-tmdev.vercel.app/ , READY, dpl_9xC2hhfPwJTNY5jtWZoZfMekZgFk. No production settings or code were changed.

| Case | Result | Observed evidence | Evidence class |
|---|---|---|---|
| PAY-01 success | PASS | RP-QA-001 R100.00/Black/Medium, R0 shipping. Order cd487f247e02f59753974bceddc3161be56ca5d8648fafaf observed pending, then paid; payment bb0185e98b4350c14d3983df7b9d32beb9b7e3a12e428ea1; actual PayFast transaction3479203; one verified COMPLETE event, one receipt job. | Actual sandbox wallet, real ITN and real database |
| PAY-02 cancellation | PASS | Order6530405e4f72e118d9e90966742fc18ad339c9e2dd27dbb0 cancelled through actual PayFast dialog; remains pending/unpaid, no event/provider transaction/receipt. Stock remains reserved pending reconciliation. | Actual provider UI/return and database |
| PAY-03 failure | BLOCKED | No provider-supported declined/FAILED wallet scenario available. Controlled FAILED state/notification tests pass, but do not satisfy this real-provider acceptance case. | External provider capability limit |
| PAY-04 invalid ITN | PASS | External callback POST returned400 BAD_SIGNATURE, without interactive login; forged-callback integration cases passed. | Real callback rejection + explicitly controlled integration |
| PAY-05 duplicate real ITN | BLOCKED | No resend/replay of the real validated notification was obtained. Sandbox documentation says notifications are sent once. Raw provider callback body/signature is not stored by the app; it was not fabricated or reconstructed and represented as real evidence. Controlled valid-duplicate tests pass without duplicate receipt/order/stock changes. | External provider replay limit; controlled evidence separate |
| PAY-06 incorrect amount | PASS (controlled) | Executed signed amount-mismatch integration case rejected an incorrect amount; recorded order total remains authoritative. | Controlled gateway network/DNS mocks, not real PayFast acceptance |
| PAY-07 retry | PASS | Real checkout retried with the same idempotency key returned the existing pending order, with stock reduced only once. Existing verified event retry tests also passed. | Real checkout API + controlled event replay |

## Signature, identity and callback boundary

The real hosted form used the sandbox process endpoint, official shared sandbox merchant identification, R100.00, an opaque payment reference and correctly scoped return/cancel URLs. Its notification URL contains no reusable Vercel bypass secret. PayFast accepted the signed form. The deployed verifier checked ITN signature, merchant, trusted source address and PayFast's server-side VALID response before the transaction service checked payment reference, exact order total and supported status. A browser redirect did not mark the order paid.

Provider callback https://royalpriesthood-payfast-itn-tmdev.vercel.app/api/commerce/payfast/notify retains its existing callback-only alias exception. Routing middleware allows only exact sandbox Preview POST without query parameters. Fresh checks: ITN invalid signature400; callback alias root404; storefront without tester authentication302. No new exception, automation secret or protection weakening was introduced during closure.

## Provider evidence and hard blocker

PayFast's official documentation states that the sandbox has one funded wallet payment method and no connections to external payment systems, so payments are successful. It also states that sandbox notifications are sent once. See [official developer documentation](https://developers.payfast.co.za/) (Sandbox / Payment methods / Payment notifications) and [official support explanation](https://support.payfast.help/portal/en/kb/articles/what-is-the-difference-between-the-sandbox-and-the-live-payfast-system-20-9-2022). The provider replaces other payment methods with a virtual wallet and does not send confirmation email in sandbox.

These are specific external capability blockers, not observed code defects. No speculative payment changes or production tests were attempted. Smallest next action: obtain a provider-backed method for the required FAILED/replay scenarios, or an explicit acceptance waiver that treats the separately labelled controlled cases as sufficient. Until then the strict prototype closure gate is BLOCKED.

## Email and inventory boundaries

The paid R100 order has one pending receipt and zero sent notifications. RESEND_API_KEY and verified EMAIL_FROM are absent; application inbox delivery was not tested or claimed. It belongs to the post-prototype backlog. PayFast's success-screen receipt text is not application-email evidence.

Initial SKU stock5 → paid reservation4 → second cancelled-checkout reservation3. No restock was fabricated after the browser cancel. The R5 fixture from the earlier gate was deactivated; old orders and payment evidence were preserved. Fixture upsert uses stable product/variant IDs and does not refill remaining stock.

References: prototype-journey-results.json, prototype-database-state.json, prototype-paid.png, prototype-cancelled.png, prototype-access-checks.json, check.log, commerce-e2e.log. Prior R5 transaction3479071 is historical evidence, not substituted for this R100 acceptance run.
