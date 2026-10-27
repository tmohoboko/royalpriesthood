# RP-V2.1.1 genuine sandbox payment evidence

**PASS: actual PayFast wallet completion and verified PAID notification on this candidate.**

Implementation 5a5113e33287e150d1632d88e4ad06b6ad95763a; deployment dpl_3deczHMQtCM7tM8nyof5rCR2mLkj. Order `a9383659c0a91752d67fa96a35c0d48ae1509caec73d136e`; payment `35ad83cfa02f458516c4ad6577b3e7d7c2a28e5ab76dbe39`; genuine provider transaction **3479543**, **R110.00** for RP-UAT211-T01-L (explicitly synthetic ZAR fixture). Browser submitted the real sandbox form and clicked Complete Payment. PayFast displayed a success message. Independent PostgreSQL and authenticated API prove PAID, one verified event and one receipt. No gateway/notification/DB/email mocks were injected into hosted acceptance.

Available inventory is reserved at pending checkout:6→5. The verified payment confirms that reservation; stock remains5. It is not deducted again at PAID. Existing tab focus and refresh show5; final PostgreSQL/API reconciliation agrees. Valid duplicate COMPLETE processing with one reservation/event/receipt is tested using explicit local gateway HTTP/DNS fixtures, not claimed as a second genuine provider notification.

Before payment, three actual unsigned/tampered COMPLETE/FAILED/CANCELLED posts returned400 BAD_SIGNATURE. Browser return still showed PENDING/no receipt. Verified failure/cancellation and valid duplicate scenarios are separately controlled local regression. No genuine cancelled/failed transaction is claimed for this candidate.

Receipt: one `pending` job, sent_at null → RECEIPT_QUEUED. No application sending/mailbox delivery evidence exists. PayFast's own shared-test-account receipt message is not evidence of application email delivery. Existing receipt-provider absence remains an accepted limitation, not a failed truthful-status smoke case.

Additional recovery test: an uninitiated synthetic reservation was safely cancelled through the application API (no PayFast initiation). It reproduced the old immutable Preview's stale display5 while authoritative stock4, proved the fixed focus display4, and restored stock5 through normal cancellation. Its cancelled test order is retained alongside the single paid candidate order. No real stock was inflated and no historical reservation was released.

Evidence: genuine-payment.json; postgres-final-evidence.json; postgres-api-final-reconciliation.json; inventory-flow.json; negative-provider-events.json; stale-tab-before-after.json; hosted-smoke.log; screenshots. The real provider endpoint is https://sandbox.payfast.co.za/eng/process. Callback remains the guarded Preview-only ITN alias. Live mode remains disabled.
