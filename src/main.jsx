import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, ArrowUpRight, Search } from 'lucide-react';
import { categories, craft, stories } from './data';
import './style.css';
import { Header, Footer } from './StorefrontShell.jsx';
import { StorefrontContext, useStorefront } from './StorefrontContext.jsx';
import { legacyCatalogueTarget } from './navigation.js';
import { resolveCatalogue } from './catalogue.js';
import ProductCard, { CatalogueImage } from './CatalogueCard.jsx';
import Wishlist, { wishlistApi } from './Wishlist.jsx';
const followLegacyCatalogue = () => { const target=legacyCatalogueTarget(window.location);if(target)window.location.replace(target); };
followLegacyCatalogue();
window.addEventListener('hashchange',followLegacyCatalogue);
const Commerce = React.lazy(() => import('./Commerce.jsx'));



function Hero({ onShop }) {
  return <main id="top" className="hero">
    <div className="hero-copy">
      <span className="overline">NEW COLLECTION / 2026</span>
      <h1>Wear your<br/>{' '}<em>identity.</em></h1>
      <p>Royal Priesthood brings men’s and women’s apparel into one considered black, ivory and gold wardrobe.</p>
      <div className="hero-actions"><button type="button" onClick={onShop}>SHOP THE COLLECTION <ArrowRight size={18}/></button><a href="#women">VIEW THE EDITS <ArrowUpRight size={16}/></a></div>
      <div className="hero-meta"><span>MEN / WOMEN</span><span>TEES / PANTS / SHOES / HATS</span></div>
    </div>
    <div className="hero-images">
      <figure className="hero-primary"><CatalogueImage src="/images/catalog/03_Women_Gold_Crest.png" alt="Royal Priesthood women's gold crest look"/><figcaption>WOMEN / GOLD CREST</figcaption></figure>
      <figure className="hero-secondary"><CatalogueImage src="/images/catalog/07_Men_Gold_Crest.png" alt="Royal Priesthood men's gold crest look"/><figcaption>MEN / GOLD CREST</figcaption></figure>
      <span className="hero-stamp">RP<br/>26</span>
    </div>
  </main>;
}

function CategoryRail({ filter, onFilter }) {
  return <section className="category-rail" aria-label="Shop categories">
    {categories.filter(c => c !== 'Accessories').slice(1).map((category, index) => <button key={category} type="button" className={filter === category ? 'active' : ''} onClick={() => onFilter(category)}><span>0{index + 1}</span>{category}<ArrowUpRight size={17}/></button>)}
  </section>;
}

function EditSection({ id, story, reverse = false, onShop }) {
  return <section id={id} className={`edit ${reverse ? 'reverse' : ''}`}>
    <div className="edit-copy">
      <span className="overline dark">{story.eyebrow}</span>
      <h2>{story.title.split('\n').map((line, index) => <React.Fragment key={line}>{line}{index === 0 && <br/>}</React.Fragment>)}</h2>
      <p>{story.body}</p>
      <button type="button" onClick={onShop}>SHOP {id.toUpperCase()} <ArrowRight size={18}/></button>
    </div>
    <div className="edit-images">
      <CatalogueImage src={story.images[0]} alt={`${id} statement look`} loading="lazy"/>
      <CatalogueImage src={story.images[1]} alt={`${id} weekend look`} loading="lazy"/>
      <span>{id === 'women' ? '01' : '02'} / EDIT</span>
    </div>
  </section>;
}


function Catalogue({ initialFilter, onFilter, onAdd }) {
  const { catalogue: products } = useStorefront();
  const [query, setQuery] = useState('');
  const visible = useMemo(() => products.filter(item => {
    const categoryMatch = initialFilter === 'All' || item.tags.includes(initialFilter);
    const term = query.trim().toLowerCase();
    const searchMatch = !term || `${item.name} ${item.department} ${item.tone}`.toLowerCase().includes(term);
    return categoryMatch && searchMatch;
  }), [initialFilter, query, products]);

  return <section id="catalogue" className="catalogue shell">
    <div className="catalogue-head">
      <div><span className="overline dark">THE NEW CATALOGUE / {products.length} LOOKS</span><h2>Choose the<br/><em>whole look.</em></h2></div>
      <p>Use the category edit to explore the same collection by department. Pants and shoes are shown inside the complete styled looks.</p>
    </div>
    <div className="catalogue-toolbar">
      <div className="filters" role="group" aria-label="Filter catalogue">{categories.map(category => <button type="button" key={category} className={initialFilter === category ? 'active' : ''} onClick={() => onFilter(category)} aria-pressed={initialFilter === category}>{category}</button>)}</div>
      <label className="search"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search collection" aria-label="Search catalogue"/></label>
    </div>
    <div className="catalogue-count"><span>{String(visible.length).padStart(2, '0')} RESULTS</span><span>{initialFilter.toUpperCase()} EDIT</span></div>
    {visible.length ? <div className="product-grid">{visible.map((item, index) => <ProductCard key={item.id} item={item} index={index} onAdd={onAdd}/>)}</div> : <div className="no-results">No matching collection pieces.<button type="button" onClick={() => { setQuery(''); onFilter('All'); }}>Reset catalogue</button></div>}
  </section>;
}

function Craft() {
  return <section id="craft" className="craft">
    <div className="craft-intro"><span className="overline">DETAIL / IDENTITY</span><h2>Made to carry<br/>the mark.</h2><p>The identity continues through the inside label and embroidered finish — small details with a deliberate presence.</p></div>
    {craft.map((item, index) => <article key={item.title}><CatalogueImage src={item.image} alt={item.title} loading="lazy"/><div><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.copy}</p></div></article>)}
  </section>;
}

function Statement() {
  return <section className="statement"><span>ROYAL PRIESTHOOD</span><h2>Not just what you wear.<br/><em>Who you remember you are.</em></h2><p>BLACK / IVORY / CROWN GOLD</p></section>;
}

function Contact() {
  return <section id="contact" className="contact"><div><span className="overline">CONTACT</span><h2>Build your<br/>Royal wardrobe.</h2><p>Save your favourite pieces to your Wishlist. Visit your account to review purchases.</p><a href="/shop/account">My account</a></div></section>;
}

function Storefront() {
  const [filter, setFilter] = useState('All');
  const [catalogue, setCatalogue] = useState(() => resolveCatalogue());
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState(null);
  const [cartSummary, setCartSummary] = useState(null);
  const [user, setUser] = useState(null);
  async function refreshCart(){const r=await fetch('/api/commerce/cart');if(!r.ok)throw Error('Cart unavailable');const c=await r.json();setCartSummary(c.summary);setCartItems(c.items);setCartCount(c.items.reduce((n,i)=>n+i.quantity,0));return c.items;}
  async function addToCart(variantId){const items=await refreshCart();const r=await fetch('/api/commerce/cart',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({variantId,quantity:(items.find(i=>i.id===variantId)?.quantity||0)+1})});const c=await r.json();if(!r.ok){await refreshProducts().catch(()=>{});throw Error(c.error?.message||'Cart unavailable');}setCartSummary(c.summary);setCartItems(c.items);setCartCount(c.items.reduce((n,i)=>n+i.quantity,0));await refreshProducts().catch(()=>{});}
  const refreshProducts = useCallback(async()=>{const r=await fetch('/api/commerce/products');if(!r.ok)throw Error('Catalogue unavailable');const d=await r.json();setCatalogue(d.products);return d;},[]);
  useEffect(()=>{
    refreshProducts().catch(()=>{});refreshCart().catch(()=>{});fetch('/api/commerce/me').then(r=>r.json()).then(d=>setUser(d.user)).catch(()=>{});
    const refreshAvailability=()=>{if(!document.hidden){refreshProducts().catch(()=>{});refreshCart().catch(()=>{});}};
    window.addEventListener('focus',refreshAvailability);document.addEventListener('visibilitychange',refreshAvailability);
    return ()=>{window.removeEventListener('focus',refreshAvailability);document.removeEventListener('visibilitychange',refreshAvailability)};
  },[refreshProducts]);
  const [wishlist, setWishlist] = useState([]);
  const [bagOpen, setBagOpen] = useState(false);
  const closeWishlist = useCallback(()=>setBagOpen(false), []);
  async function refreshWishlist() { const r=await wishlistApi(); setWishlist(r.items); return r.items; }
  useEffect(()=>{ refreshWishlist().catch(()=>{}); },[user?.id]);
  async function toggleWishlist(productId, variantId='') {
    const existing=wishlist.find(i=>i.product_id===productId&&i.variant_id===variantId);
    const r=existing?await wishlistApi(`/${existing.id}`,'DELETE'):await wishlistApi('','POST',{productId,variantId});
    setWishlist(r.items);
    return !existing;
  }
  const goToCatalogue = category => {
    window.location.assign('/shop'+(category==='All'?'':'?category='+encodeURIComponent(category)));
  };
  const commerce = window.location.pathname.startsWith('/shop');
  return <StorefrontContext.Provider value={{ catalogue, setCatalogue, refreshProducts, wishlist, setWishlist, refreshWishlist, toggleWishlist, cartCount, cartItems, cartSummary, setCartCount, refreshCart, addToCart, user, setUser }}>
    <Header count={wishlist.length} onBag={() => setBagOpen(true)} cartCount={cartCount} user={user}/>
    {commerce ? <React.Suspense fallback={<p role="status">Loading shop…</p>}><Commerce/></React.Suspense> : <>
    <Hero onShop={() => goToCatalogue('All')}/>
    <CategoryRail filter={filter} onFilter={goToCatalogue}/>
    <EditSection id="women" story={stories.women} onShop={() => goToCatalogue('Women')}/>
    <EditSection id="men" story={stories.men} reverse onShop={() => goToCatalogue('Men')}/>
    <Catalogue initialFilter={filter} onFilter={setFilter}/>
    <Craft/>
    <Statement/>
    <Contact/>
    </>}
    <Footer/>
    {bagOpen && <Wishlist onClose={closeWishlist}/>}
  </StorefrontContext.Provider>;
}

createRoot(document.getElementById('root')).render(<Storefront/>);
