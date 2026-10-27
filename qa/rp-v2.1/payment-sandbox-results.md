# RP-V2.1 genuine PayFast sandbox acceptance

**PASS for sandbox payment, verified notification, confirmation and receipt generation. Actual email delivery is BLOCKED by absent email-provider configuration.** No live payment activation occurred.

- Implementation: `d44eeecfacb864b1b13265f5c1dd79935d226fae`
- Preview deployment: `dpl_GssRABAMmYXbJB4sHFPSaA8Ep5om`
- Order: `d447327199754c8aba9462b250dd2b39c8734075668cc851`
- Payment reference: `c9fabdc39afa45421a2df14f3ba0077b2fb9246b44e2324d`
- Genuine PayFast sandbox transaction: **3479473**
- Amount: **R100.00**, from the existing approved QA variant, shipping R0 for its existing test-only shipping option.
- Provider: `https://sandbox.payfast.co.za/eng/process`
- Notification host: `https://royalpriesthood-payfast-itn-tmdev.vercel.app/api/commerce/payfast/notify`

The actual provider wallet page displayed the correct amount/reference; the browser clicked Complete Payment. There was no synthetic notification or mocked network verification in hosted acceptance. The provider captured screenshot immediately after clicking was still loading; it is process evidence, not a claim that a success message was observed. Independent SQL subsequently proves the production verification path persisted `paid` order/payment, provider ID 3479473, exactly one payment event and exactly one receipt. Browser confirmation and customer history show the same reference, amount and paid state.

Two actual invalid-signature callback replays returned HTTP400 BAD_SIGNATURE. Final SQL still shows one event/one receipt, with no payment regression. The callback-only alias denies storefront/API/query-spoofing requests with 404. The storefront retains deployment authentication. Original production alias remains at `dpl_9vFzqtHSBVXwgEZSv3cm1WZtoAzG`.

Receipt persisted status is `pending`, mapped to **RECEIPT_QUEUED**, with `sent_at: null`. Generation and queue insertion PASS; sending and mailbox delivery were not performed. `sent` maps to RECEIPT_SENT (email-provider acceptance, not confirmed mailbox delivery); `failed` maps to RECEIPT_FAILED. Retry/failure and mocked sent behavior pass local integration/browser tests. No claim of actual email delivery is made.

Valid duplicate callbacks, wrong merchant/reference/amount/status, cancellation and inventory release were exercised by the existing automated integration/browser suites with explicit gateway HTTP/DNS/email fixtures. They are not additional genuine provider transactions. SMK-18 used the permitted real invalid-callback path; no second provider cancellation transaction was needed.

Evidence: provider-initial.json, provider-result.json, provider.log, provider-completion.log, payment-confirmation.json, payment-database-evidence.json, confirmation.log, and ui-acceptance-screenshots/. Remaining test stock is two; the single genuine sandbox order remains paid as acceptance evidence. No physical fulfilment was requested.
