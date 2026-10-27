import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, ArrowUpRight, Check, Copy, Menu, Minus, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import { categories, craft, products, stories } from './data';
import './style.css';
const Commerce = React.lazy(() => import('./Commerce.jsx'));


function CatalogueImage({src,...props}){
 const base=src?.startsWith('/images/catalog/')?src.replace('/images/catalog/','/images/catalog/web/').replace(/\.png$/,''):null;
 return <img {...props} src={base?`${base}-960.webp`:src} srcSet={base?`${base}-480.webp 480w, ${base}-960.webp 960w, ${base}-1600.webp 1600w`:undefined} sizes={base?'(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 40vw':undefined} decoding="async"/>;
}

const MAIL = import.meta.env.VITE_CONTACT_EMAIL || '';
async function prepareEnquiry(text, filename){try{await navigator.clipboard.writeText(text);return 'copied'}catch{const url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return 'download'}}

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

function Mark() {
  return <a className="mark" href="#top" aria-label="Royal Priesthood home"><span className="mark-symbol">RP</span><span><b>ROYAL PRIESTHOOD</b><small>CROWNED WITH PURPOSE</small></span></a>;
}

function Header({ count, onBag }) {
  const [open, setOpen] = useState(false);
  const links = [['Women', '#women'], ['Men', '#men'], ['Catalogue', '#catalogue'], ['Shop', '/shop'], ['Account', '/shop/account'], ['Craft', '#craft'], ['Contact', '#contact']];
  return <>
    <div className="topline"><span>ROYAL PRIESTHOOD / SOUTH AFRICA</span><span>MADE-TO-ORDER COLLECTION</span></div>
    <header className="header">
      <Mark />
      <nav className="nav desktop" aria-label="Main navigation">{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <div className="header-tools">
        <button className="bag-trigger" type="button" onClick={onBag} aria-label={`Open enquiry bag with ${count} items`}><ShoppingBag size={18}/><span>ENQUIRY</span><b>{count}</b></button>
        <button className="menu-trigger" type="button" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(v => !v)}>{open ? <X/> : <Menu/>}</button>
      </div>
    </header>
    {open && <nav className="mobile-nav" aria-label="Mobile navigation">{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={18}/></a>)}</nav>}
  </>;
}

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
    {categories.slice(1).map((category, index) => <button key={category} type="button" className={filter === category ? 'active' : ''} onClick={() => onFilter(category)}><span>0{index + 1}</span>{category}<ArrowUpRight size={17}/></button>)}
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

function ProductCard({ item, index, onAdd }) {
  const [size, setSize] = useState('L');
  return <article className={`product-card ${index % 7 === 0 ? 'wide' : ''}`} data-testid="product-card">
    <div className="product-media">
      <CatalogueImage src={item.image} alt={item.name} loading="lazy"/>
      <span className="product-code">{item.id}</span>
      <span className="product-department">{item.department}</span>
    </div>
    <div className="product-info">
      <div><p>{item.tone}</p><h3>{item.name}</h3></div>
      <div className="product-buy">
        <label>SIZE<select aria-label={`Size for ${item.name}`} value={size} onChange={event => setSize(event.target.value)}>{SIZES.map(value => <option key={value}>{value}</option>)}</select></label>
        <button type="button" onClick={() => onAdd({ ...item, size, quantity: 1 })}>ADD <Plus size={17}/></button>
      </div>
      <small>Price and availability on request · <a href={`/shop/products/${item.id}`}>View purchase options</a></small>
    </div>
  </article>;
}

function Catalogue({ initialFilter, onFilter, onAdd }) {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => products.filter(item => {
    const categoryMatch = initialFilter === 'All' || item.tags.includes(initialFilter);
    const term = query.trim().toLowerCase();
    const searchMatch = !term || `${item.name} ${item.department} ${item.tone}`.toLowerCase().includes(term);
    return categoryMatch && searchMatch;
  }), [initialFilter, query]);

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

function Contact({ items }) {
  const [values, setValues] = useState(()=>{try{return {name:'',email:'',note:'',...JSON.parse(sessionStorage.getItem('royal:brief')||'{}')}}catch{return {name:'',email:'',note:''}}});
  useEffect(()=>{try{sessionStorage.setItem('royal:brief',JSON.stringify(values))}catch{}},[values]);
  const [copied, setCopied] = useState(false);
  const [error,setError]=useState('');
  const update = event => setValues(current => ({ ...current, [event.target.name]: event.target.value }));
  const summary = `ROYAL PRIESTHOOD — COLLECTION ENQUIRY\nName: ${values.name || '(not provided)'}\nEmail: ${values.email || '(not provided)'}\nRequest: ${values.note || '(not provided)'}\n\nSelected pieces:\n${items.length ? items.map(item => `${item.quantity} × ${item.name} / ${item.size}`).join('\n') : 'No pieces selected yet.'}`;
  const copy = async event => {
    event.preventDefault();
    setError('');try{if(MAIL){window.location.href=`mailto:${MAIL}?subject=${encodeURIComponent('Royal Priesthood enquiry')}&body=${encodeURIComponent(summary)}`;setCopied('draft')}else setCopied(await prepareEnquiry(summary,'royal-priesthood-enquiry.txt'))}catch{setError('Could not prepare your enquiry. Please try again.')}
  };
  return <section id="contact" className="contact">
    <div><span className="overline">PRIVATE ENQUIRY</span><h2>Build your<br/>Royal wardrobe.</h2><p>Select pieces from the catalogue, then send the brief through your preferred channel. No payment is taken on this site.</p></div>
    <form onSubmit={copy}>
      <label>NAME<input required name="name" value={values.name} onChange={update} placeholder="Your name"/></label>
      <label>EMAIL<input required type="email" name="email" value={values.email} onChange={update} placeholder="you@example.com"/></label>
      <label>WHAT DO YOU NEED?<textarea required name="note" value={values.note} onChange={update} rows="4" placeholder="Sizes, quantities, deadline or custom request"/></label>
      <button type="submit">{copied==='copied'?'ENQUIRY COPIED':copied==='download'?'DOWNLOAD STARTED':copied==='draft'?'EMAIL DRAFT OPENED':MAIL?'OPEN EMAIL DRAFT':'COPY ENQUIRY BRIEF'}{copied ? <Check size={18}/> : <Copy size={18}/>}</button>
      <small>Your brief is prepared for you to send. No order is submitted and no payment is taken.{!MAIL&&' Contact details are awaiting confirmation.'}</small>{copied&&<p role="status">{copied==='copied'?'Enquiry copied — ready to send.':copied==='download'?'Enquiry download started — ready to send.':'Email draft opened — please send it from your mail app.'}</p>}{error&&<p role="alert">{error}</p>}
    </form>
  </section>;
}

function Bag({ open, items, onClose, onQuantity, onRemove }) {
  const [copied, setCopied] = useState(false);
  const [error,setError]=useState('');
  useEffect(() => {
    if (!open) return undefined;
    const previous=document.activeElement;const panel=document.querySelector('.drawer');const nodes=()=>[...panel.querySelectorAll('button:not([disabled]),a[href]')];nodes()[0]?.focus();
    const escape = event => {if(event.key==='Escape')onClose();if(event.key==='Tab'){const first=nodes()[0],last=nodes().at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}};
    document.addEventListener('keydown', escape);
    return () => {document.removeEventListener('keydown', escape);if(previous?.isConnected)previous.focus()};
  }, [open, onClose]);
  if (!open) return null;
  const total = items.reduce((sum, item) => sum + item.quantity, 0);
  const copy = async () => {
    setError('');try{setCopied(await prepareEnquiry(`ROYAL PRIESTHOOD ENQUIRY\n${items.map(item => `${item.quantity} × ${item.name} / ${item.size}`).join('\n')}\n\nPlease confirm price, availability and production time.`,'royal-priesthood-bag.txt'))}catch{setError('Could not prepare your enquiry. Please try again.')}
  };
  return <div className="drawer-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <aside className="drawer" role="dialog" aria-modal="true" aria-label="Enquiry bag">
      <div className="drawer-head"><div><span>YOUR SELECTION</span><h2>Enquiry bag <em>{total}</em></h2></div><button type="button" onClick={onClose} aria-label="Close enquiry bag"><X/></button></div>
      <div className="drawer-body">{items.length ? items.map(item => <article key={`${item.id}-${item.size}`} className="drawer-item"><CatalogueImage src={item.image} alt=""/><div><span>{item.id}</span><h3>{item.name}</h3><p>{item.tone} / Size {item.size}</p><div className="quantity"><button type="button" aria-label="Decrease quantity" onClick={() => onQuantity(item, -1)}><Minus size={14}/></button><b>{item.quantity}</b><button type="button" aria-label="Increase quantity" onClick={() => onQuantity(item, 1)}><Plus size={14}/></button><button type="button" className="remove" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item)}><Trash2 size={15}/></button></div></div></article>) : <div className="drawer-empty"><ShoppingBag size={45}/><h3>Your bag is empty.</h3><p>Add a look, tee or accessory to request availability.</p><button type="button" onClick={onClose}>BROWSE CATALOGUE</button></div>}</div>
      <div className="drawer-foot"><p>This is an enquiry only. No payment or stock reservation is processed.</p><button type="button" disabled={!items.length} onClick={copy}>{copied==='copied'?'COPIED':copied==='download'?'DOWNLOAD STARTED':'COPY ENQUIRY'}{copied ? <Check size={17}/> : <Copy size={17}/>}</button>{error&&<p role="alert">{error}</p>}<a href="#contact" onClick={onClose}>ADD CONTACT DETAILS <ArrowRight size={15}/></a></div>
    </aside>
  </div>;
}

function Footer() {
  return <footer><Mark/><div className="footer-word">ROYAL<br/><span>PRIESTHOOD</span></div><div className="footer-line"><span>© {new Date().getFullYear()} ROYAL PRIESTHOOD</span><a href="#top">BACK TO TOP ↑</a><span>STRAIGHTENING THE CROWNS</span></div></footer>;
}

function App() {
  const [filter, setFilter] = useState('All');
  const [bag, setBag] = useState(()=>{try{return JSON.parse(localStorage.getItem('royal:bag')||'[]').filter(i=>products.some(p=>p.id===i.id)&&SIZES.includes(i.size)&&Number.isInteger(i.quantity)&&i.quantity>0&&i.quantity<=99).map(i=>({...products.find(p=>p.id===i.id),size:i.size,quantity:i.quantity}))}catch{return []}});
  useEffect(()=>{try{localStorage.setItem('royal:bag',JSON.stringify(bag.map(({id,size,quantity})=>({id,size,quantity}))))}catch{}},[bag]);
  const [bagOpen, setBagOpen] = useState(false);
  const itemCount = bag.reduce((sum, item) => sum + item.quantity, 0);
  const goToCatalogue = category => {
    setFilter(category);
    document.querySelector('#catalogue')?.scrollIntoView({ behavior: 'smooth' });
  };
  const add = item => {
    setBag(current => {
      const match = current.find(entry => entry.id === item.id && entry.size === item.size);
      return match ? current.map(entry => entry === match ? { ...entry, quantity: Math.min(99,entry.quantity + 1) } : entry) : [...current, item];
    });
    setBagOpen(true);
  };
  const quantity = (item, delta) => setBag(current => current.flatMap(entry => entry.id === item.id && entry.size === item.size ? (entry.quantity + delta > 0 ? [{ ...entry, quantity: Math.min(99,entry.quantity + delta) }] : []) : [entry]));
  const remove = item => setBag(current => current.filter(entry => !(entry.id === item.id && entry.size === item.size)));

  return <>
    <Header count={itemCount} onBag={() => setBagOpen(true)}/>
    <Hero onShop={() => goToCatalogue('All')}/>
    <CategoryRail filter={filter} onFilter={goToCatalogue}/>
    <EditSection id="women" story={stories.women} onShop={() => goToCatalogue('Women')}/>
    <EditSection id="men" story={stories.men} reverse onShop={() => goToCatalogue('Men')}/>
    <Catalogue initialFilter={filter} onFilter={setFilter} onAdd={add}/>
    <Craft/>
    <Statement/>
    <Contact items={bag}/>
    <Footer/>
    <Bag open={bagOpen} items={bag} onClose={() => setBagOpen(false)} onQuantity={quantity} onRemove={remove}/>
  </>;
}

createRoot(document.getElementById('root')).render(window.location.pathname.startsWith('/shop') ? <React.Suspense fallback={<p role="status">Loading shop…</p>}><Commerce/></React.Suspense> : <App/>);
