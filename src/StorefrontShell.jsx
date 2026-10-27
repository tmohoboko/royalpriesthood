import React, { useState } from 'react';
import { ArrowUpRight, Menu, ShoppingBag, X } from 'lucide-react';
function Mark() {
  return <a className="mark" href="/#top" aria-label="Royal Priesthood home"><span className="mark-symbol">RP</span><span><b>ROYAL PRIESTHOOD</b><small>CROWNED WITH PURPOSE</small></span></a>;
}

function Header({ count, onBag, cartCount, user }) {
  const [open, setOpen] = useState(false);
  const links = [['Women', '/#women'], ['Men', '/#men'], ['Catalogue', '/#catalogue'], ['Shop', '/shop'], [user ? 'My account' : 'Account', '/shop/account'], ['Craft', '/#craft'], ['Contact', '/#contact'], ...(user?.role === 'admin' ? [['Admin', '/shop/admin']] : [])];
  return <>
    <div className="topline"><span>ROYAL PRIESTHOOD / SOUTH AFRICA</span><span>MADE-TO-ORDER COLLECTION</span></div>
    <header className="header">
      <Mark />
      <nav className="nav desktop" aria-label="Main navigation">{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <div className="header-tools"><a className="bag-trigger cart-trigger" href="/shop/cart" aria-label={`Shopping cart with ${cartCount} items`}><ShoppingBag size={18}/><span>CART</span><b>{cartCount}</b></a>
        <button className="bag-trigger" type="button" onClick={onBag} aria-label={`Open enquiry bag with ${count} items`}><ShoppingBag size={18}/><span>ENQUIRY</span><b>{count}</b></button>
        <button className="menu-trigger" type="button" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(v => !v)}>{open ? <X/> : <Menu/>}</button>
      </div>
    </header>
    {open && <nav className="mobile-nav" aria-label="Mobile navigation">{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={18}/></a>)}</nav>}
  </>;
}

function Footer() {
  return <footer><Mark/><div className="footer-word">ROYAL<br/><span>PRIESTHOOD</span></div><div className="footer-line"><span>© {new Date().getFullYear()} ROYAL PRIESTHOOD</span><a href="/#top">BACK TO TOP ↑</a><span>STRAIGHTENING THE CROWNS</span></div></footer>;
}


export { Header, Footer };
