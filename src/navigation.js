export function legacyCatalogueTarget({pathname,search='',hash=''}) {
  if (/^\/catalogue(?:\/|$)/i.test(pathname)) return pathname.replace(/^\/catalogue/i,'/shop')+search;
  if (pathname==='/' && /^#catalogue\/?$/i.test(hash)) return '/shop'+search;
  if (/^\/shop\/catalogue\/?$/i.test(pathname)) return '/shop'+search;
  return null;
}
