# RP-V2.1.1 final hosted smoke results

**21/21 PASS,0 FAIL,0 BLOCKED.** Every case was executed against the final Preview candidate; no simulated gateway result is counted as genuine.

Commit: `5a5113e33287e150d1632d88e4ad06b6ad95763a`; deployment: `dpl_3deczHMQtCM7tM8nyof5rCR2mLkj`. Suite RP211-1; fixture RP211-UAT-1. Full per-case preconditions, actions, expected/actual results, status, evidence paths, commit and deployment are in smoke-results.json.

Test | Work item | Result | Actual result
---|---|---|---
SMK-211-01 | RP-211-01 | PASS | Homepage200; accepted shared design and shell
SMK-211-02 | RP-211-01 | PASS | Desktop/mobile each expose canonical Shop once; Catalogue absent
SMK-211-03 | RP-211-01 | PASS | All four legacy routes resolve; Women/Men reach filtered Shop
SMK-211-04 | RP-211-01,RP-211-04 | PASS | All16 approved identities/images/categories present;16 remain pending-pricing;22 public cards
SMK-211-05 | RP-211-03 | PASS | Saved entry survives refresh/navigation; removal persists and counters update
SMK-211-06 | RP-211-03,RP-211-04 | PASS | Confirmed RP-UAT211-T01-L quantity1, unit priceR110.00
SMK-211-07 | RP-211-02,RP-211-03 | PASS | Quantity1;subtotalR110;discountR0;deliveryR0;estimated totalR110
SMK-211-08 | RP-211-03 | PASS | Both requests409;Cart remains chosen quantity1;legacy stock unchanged at0
SMK-211-09 | RP-211-02 | PASS | Empty and whitespace-only discount accepted;no error;no order submitted
SMK-211-10 | RP-211-02 | PASS | Inline INVALID_PROMOTION;review cleared;0 checkout requests/0 orders
SMK-211-11 | RP-211-03 | PASS | Registration/login retain and merge Cart;logout isolates account;Wishlist retained
SMK-211-12 | RP-211-02,RP-211-03,RP-211-04 | PASS | One PENDING order a9383659c0a91752d67fa96a35c0d48ae1509caec73d136e;R110 despite tampered totals;stock6→5 once at reservation
SMK-211-13 | RP-211-03,RP-211-04 | PASS | Correct real sandbox endpoint,merchant fields/signature,R110,payment reference 35ad83cfa02f458516c4ad6577b3e7d7c2a28e5ab76dbe39
SMK-211-14 | RP-211-03,RP-211-04 | PASS | Genuine PayFast transaction 3479543;R110;verified backendPAID
SMK-211-15 | RP-211-03 | PASS | Paid orderR110 visible to owner;oneRECEIPT_QUEUED/unsent;other authenticated customer404;no delivery claim
SMK-211-16 | RP-211-03 | PASS | Three real tampered status posts rejected400 BAD_SIGNATURE;browser return leaves PENDING/no receipt;verified negative cases covered separately by local fixtures
SMK-211-17 | RP-211-04 | PASS | PostgreSQL:23 products,16 approved references,5 new fixture products/10 variants,6 initial units per variant; original rows match baseline
SMK-211-18 | RP-211-04 | PASS | All10 SQL variants match API and UI, including synthetic sandbox labels
SMK-211-19 | RP-211-04 | PASS | Five categories support Add to Cart with explicit L/Gold selection
SMK-211-20 | RP-211-02,RP-211-03,RP-211-04 | PASS | Tampered quote remainsR110/discount0;quantity99 rejected409;pending order will also receive extra fake totals to verify server authority; PostgreSQL independently confirms final orderR110 despite submitted total1/price1/discount999999
SMK-211-21 | RP-211-03,RP-211-04 | PASS | Available stock6→5 at pending;remains5 after genuine PAID;existing tab focus/reload shows5;valid duplicate callback regression controlled separately

Initial harness attempt15 PASS/1 FAIL/5 BLOCKED is retained separately. It omitted tester authentication on the intercepted checkout request; SQL proved no order/reservation. Harness correction changed no application source. Final complete rerun, genuine payment and independent SQL passed.
