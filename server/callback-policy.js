// This dedicated alias may have a Vercel protection exception. Keep it ITN-only
// even when environment variables are absent or a future deployment is aliased.
export const callbackHost = 'royalpriesthood-payfast-itn-tmdev.vercel.app';
export function callbackBoundary(request, env = process.env) {
  const url = new URL(request.url);
  if (url.hostname !== callbackHost) return;
  if (env.VERCEL_ENV !== 'preview' || env.PAYFAST_MODE !== 'sandbox' ||
      request.method !== 'POST' || url.pathname !== '/api/commerce/payfast/notify' || url.search) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
}
