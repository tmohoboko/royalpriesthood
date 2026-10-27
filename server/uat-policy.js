import { fail } from './domain.js';
export const uatEnabled = env => env.PAYFAST_MODE === 'sandbox' &&
  (env.VERCEL_ENV === 'preview' || (env.NODE_ENV === 'test' && !env.VERCEL));
export function requirePurchasableEnvironment(items, allowUat = false) {
  if (!allowUat && items.some(i=>i.sandbox_only))
    fail(403,'UAT_PREVIEW_ONLY','Synthetic UAT products can only be purchased in the isolated sandbox Preview');
}
