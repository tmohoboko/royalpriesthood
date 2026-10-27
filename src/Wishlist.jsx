import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useStorefront } from './StorefrontContext.jsx';
import { CatalogueImage } from './CatalogueCard.jsx';
export async function wishlistApi(path = '', method = 'GET', body) {
  const r = await fetch(`/api/commerce/wishlist${path}`, { method, headers: method !== 'GET' ? {'Content-Type':'application/json'} : {}, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json();
  if (!r.ok) throw Error(data.error?.message || 'Wishlist unavailable');
  return data;
}
export default function Wishlist({ onClose }) {
  const { wishlist, catalogue, refreshWishlist, setWishlist, refreshCart } = useStorefront();
  const panel = useRef(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const previous = document.activeElement, bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current.querySelector('button')?.focus();
    const key = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const nodes = [...panel.current.querySelectorAll('button:not([disabled]),a[href]')];
        const first = nodes[0], last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = bodyOverflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, [onClose]);
  useEffect(()=>{if(panel.current && !panel.current.contains(document.activeElement))panel.current.querySelector('button')?.focus()},[wishlist.length]);
  async function action(item, move = false) {
    setBusy(true); setError('');
    try { const r = await wishlistApi(`/${item.id}${move ? '/move' : ''}`, move ? 'POST' : 'DELETE', move ? {} : undefined); setWishlist(r.items); if (move) await refreshCart(); }
    catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  async function clear() {
    setBusy(true); setError('');
    try { for (const item of wishlist) await wishlistApi(`/${item.id}`, 'DELETE'); }
    catch(e) { setError(e.message); }
    finally { await refreshWishlist().catch(e=>setError(e.message)); setBusy(false); setConfirm(false); }
  }
  return <div className="drawer-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <aside ref={panel} className="drawer" role="dialog" aria-modal="true" aria-label="My Wishlist">
      <div className="drawer-head"><h2>My Wishlist ({wishlist.length})</h2><button onClick={onClose} aria-label="Close Wishlist"><X/></button></div>
      <div className="drawer-body">{wishlist.map(item=>{
        const product=catalogue.find(p=>p.id===item.product_id), variant=product?.variants.find(v=>v.id===item.variant_id);
        return <article key={item.id} className="drawer-item">{product&&<CatalogueImage src={product.image} alt=""/>}<div><h3>{product?.name||item.product_id}</h3><p>{variant?`${variant.size} / ${variant.colour}`:item.variant_id||'Product saved'}</p><p>Quantity: {item.quantity}</p><p>{variant?`R ${(variant.price/100).toFixed(2)} · ${variant.stock?'Available':'Out of stock'}`:'Pricing or availability pending'}</p><a href={`/shop/products/${item.product_id}`}>View Product</a>{variant?.stock>0&&<button disabled={busy} onClick={()=>action(item,true)}>Move to Cart</button>}<button disabled={busy} onClick={()=>action(item)}>Remove {product?.name||'saved item'}</button></div></article>;
      })}{!wishlist.length&&<p>Your Wishlist is empty.</p>}</div>
      <div className="drawer-foot">{error&&<p role="alert">{error}</p>}{confirm?<><p>Remove all saved items?</p><button disabled={busy} onClick={clear}>Confirm clear Wishlist</button><button onClick={()=>setConfirm(false)}>Keep items</button></>:<button disabled={busy||!wishlist.length} onClick={()=>setConfirm(true)}>Clear Wishlist</button>}</div>
    </aside>
  </div>;
}
