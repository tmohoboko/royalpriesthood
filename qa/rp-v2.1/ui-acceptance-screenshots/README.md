# UI acceptance screenshots

Accepted UAT states: hosted-desktop-shop.png (loaded approved images), hosted-mobile-wishlist.png (loaded saved item, mobile), hosted-checkout-review.png (R100 server quote), hosted-paid-confirmation.png (PAID/provider3479473/RECEIPT_QUEUED), hosted-order-history.png. local-mobile-wishlist.png supports local keyboard/drawer regression.

Provider/process evidence: payfast-initial.png shows real sandbox wallet and R100 reference. payfast-complete.png captures processing immediately after Complete Payment; it does not show a provider success message. hosted-order-after-provider.png captures the immediate loading transition; use hosted-paid-confirmation.png for final accepted application state. Backend SQL and authenticated API prove the real provider result independently.
