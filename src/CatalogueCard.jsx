import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useStorefront } from './StorefrontContext.jsx';
function CatalogueImage({src,...props}){
 const base=src?.startsWith('/images/catalog/')?src.replace('/images/catalog/','/images/catalog/web/').replace(/\.png$/,''):null;
 return <img {...props} src={base?`${base}-960.webp`:src} srcSet={base?`${base}-480.webp 480w, ${base}-960.webp 960w, ${base}-1600.webp 1600w`:undefined} sizes={base?'(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 40vw':undefined} decoding="async"/>;
}

function ProductCard({ item, index = 0, onPurchase, busy = false, commerce = false }) {
  const [variantId, setVariantId] = useState('');
  const { addToCart, toggleWishlist, wishlist } = useStorefront();
  const [message, setMessage] = useState('');
  const variant = item.variants?.find(v => v.id === variantId) || item.variants?.[0];
  const saved = wishlist.some(i=>i.product_id===item.id&&i.variant_id===(variant?.id||''));
  return <article className={`product-card ${commerce ? "commerce-product" : ""} ${index % 7 === 0 ? 'wide' : ''}`} data-testid="product-card" data-product-id={item.id} data-purchase-mode={item.purchaseMode}>
    <div className="product-media"><a href={`/shop/products/${item.id}`}><CatalogueImage src={item.image} alt={item.name} loading="lazy"/></a><span className="product-code">{item.id}</span><span className="product-department">{item.department}</span></div>
    <div className="product-info"><div>{item.sandbox_only && <p role="note">UAT TEST · Synthetic ZAR price · Sandbox only</p>}<p>{item.tone}</p><h3><a href={`/shop/products/${item.id}`}>{item.name}</a></h3></div>
      <div className="product-buy">{item.purchaseMode === 'direct' ? <>
        <label>VARIANT<select aria-label={`Variant for ${item.name}`} value={variant?.id || ''} onChange={e => setVariantId(e.target.value)}>{item.variants.map(v => <option key={v.id} value={v.id}>{v.size} / {v.colour} — R {(v.price/100).toFixed(2)}</option>)}</select></label>
        <button disabled={busy || !variant?.stock} onClick={async()=>{try{await (onPurchase || addToCart)(variant.id);if(!onPurchase)setMessage('Added to your cart.')}catch(e){setMessage(e.message)}}}>Add to cart</button>
      </> : <p>Pricing or availability pending</p>}
      <button aria-pressed={saved} onClick={async()=>{try{const added=await toggleWishlist(item.id,variant?.id||'');setMessage(added?'Saved to Wishlist.':'Removed from Wishlist.')}catch(e){setMessage(e.message)}}}><Heart size={17} fill={saved?'currentColor':'none'}/>{saved?'Remove from Wishlist':'Save to Wishlist'}</button></div>
      <small>{variant ? `R ${(variant.price/100).toFixed(2)} · ${variant.stock ? `${variant.stock} available` : 'Out of stock'}` : 'Pricing or availability pending.'} · <a href={`/shop/products/${item.id}`}>View product</a></small>
      {message && <p role="status">{message}</p>}
    </div></article>;
}

export { CatalogueImage };
export default ProductCard;
