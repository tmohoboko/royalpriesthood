import { products as approved } from './data.js';
// Approved identities/assets/category tags are canonical. SQL contributes only
// configured purchasing information; inactive does not hide an approved look.
export function resolveCatalogue(records = [], variants = []) {
  const byId = new Map(records.map(p => [p.id, p]));
  const identities = [...approved, ...records.filter(p => p.active && !approved.some(a => a.id === p.id)).map(p => ({...p, department:p.category, tags:[p.category], tone:''}))];
  return identities.map(p => {
    const record = byId.get(p.id);
    const configured = record?.active ? variants.filter(v => v.product_id === p.id && Number.isInteger(v.price) && v.price >= 500 && Number.isInteger(v.stock) && v.stock >= 0) : [];
    return {...p, tags:[...new Set([...(p.tags || []),p.department])], category:p.department, description:record?.description || 'Price and availability confirmed by enquiry.', approved:approved.some(a => a.id === p.id), purchaseMode:configured.length ? 'direct' : 'quote', variants:configured};
  });
}
