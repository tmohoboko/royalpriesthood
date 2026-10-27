import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStorefront } from './StorefrontContext.jsx';
const SIZES = ['S', 'M', 'L', 'XL', '2XL'];
function CatalogueImage({src,...props}){
 const base=src?.startsWith('/images/catalog/')?src.replace('/images/catalog/','/images/catalog/web/').replace(/\.png$/,''):null;
 return <img {...props} src={base?`${base}-960.webp`:src} srcSet={base?`${base}-480.webp 480w, ${base}-960.webp 960w, ${base}-1600.webp 1600w`:undefined} sizes={base?'(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 40vw':undefined} decoding="async"/>;
}

function ProductCard({ item, index = 0, onAdd, onPurchase, busy = false, commerce = false }) {
  const [size, setSize] = useState('L');
  const [variantId, setVariantId] = useState('');
  const { addToCart, addQuote } = useStorefront();
  const [message, setMessage] = useState('');
  const variant = item.variants?.find(v => v.id === variantId) || item.variants?.[0];
  return <article className={`product-card ${commerce ? "commerce-product" : ""} ${index % 7 === 0 ? 'wide' : ''}`} data-testid="product-card" data-product-id={item.id} data-purchase-mode={item.purchaseMode}>
    <div className="product-media"><a href={`/shop/products/${item.id}`}><CatalogueImage src={item.image} alt={item.name} loading="lazy"/></a><span className="product-code">{item.id}</span><span className="product-department">{item.department}</span></div>
    <div className="product-info"><div><p>{item.tone}</p><h3><a href={`/shop/products/${item.id}`}>{item.name}</a></h3></div>
      <div className="product-buy">{item.purchaseMode === 'direct' ? <>
        <label>VARIANT<select aria-label={`Variant for ${item.name}`} value={variant?.id || ''} onChange={e => setVariantId(e.target.value)}>{item.variants.map(v => <option key={v.id} value={v.id}>{v.size} / {v.colour} — R {(v.price/100).toFixed(2)}</option>)}</select></label>
        <button disabled={busy || !variant?.stock} onClick={async()=>{try{await (onPurchase || addToCart)(variant.id);if(!onPurchase)setMessage('Added to your cart.')}catch(e){setMessage(e.message)}}}>Add to cart</button>
      </> : <><label>REQUESTED SIZE<select aria-label={`Size for ${item.name}`} value={size} onChange={e=>setSize(e.target.value)}>{SIZES.map(v=><option key={v}>{v}</option>)}</select></label><button onClick={()=>(onAdd || addQuote)({...item,size,quantity:1})}>Enquiry <Plus size={17}/></button></>}</div>
      <small>{variant ? `R ${(variant.price/100).toFixed(2)} · ${variant.stock ? `${variant.stock} available` : 'Out of stock'}` : 'Price, sizing and availability confirmed by enquiry.'} · <a href={`/shop/products/${item.id}`}>View product</a></small>
      {message && <p role="status">{message}</p>}
    </div></article>;
}

export { CatalogueImage };
export default ProductCard;
