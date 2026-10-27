import React, { useEffect, useState } from "react";
import "./commerce.css";
import { useStorefront } from "./StorefrontContext.jsx";
import { categories } from "./data.js";
import CatalogueCard, { CatalogueImage } from "./CatalogueCard.jsx";
const money = (v) => `R ${(v / 100).toFixed(2)}`;
async function api(path, method = "GET", data) {
  const response = await fetch(`/api/commerce${path}`, {
    method,
    credentials: "same-origin",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw Object.assign(Error(result.error?.message || "Request failed"),{code:result.error?.code});
  return result;
}
const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];
const addressFields = [
  ["name", "Recipient name"],
  ["phone", "Phone"],
  ["line1", "Street address"],
  ["city", "City"],
  ["postal_code", "Postal code"],
];
function AddressFields({ values, setValues }) {
  return (
    <>
      <div className="commerce-fields">
        {addressFields.map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              required
              name={key}
              autoComplete={
                key === "postal_code"
                  ? "postal-code"
                  : key === "line1"
                    ? "address-line1"
                    : key === "phone"
                      ? "tel"
                      : key === "name"
                        ? "name"
                        : "address-level2"
              }
              value={values[key] || ""}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              pattern={key === "postal_code" ? "[0-9]{4}" : undefined}
            />
          </label>
        ))}
        <label>
          Province
          <select
            required
            value={values.province || ""}
            onChange={(e) => setValues({ ...values, province: e.target.value })}
          >
            <option value="">Choose province</option>
            {provinces.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
      <p>South Africa delivery only.</p>
    </>
  );
}
function Product({product, onAdd, busy, index}) {
  return <CatalogueCard item={product} index={index} onPurchase={onAdd} busy={busy} commerce/>;
}
export default function Commerce() {
  const shared = useStorefront();
  const path = window.location.pathname.replace(/\/$/, "");
  const [products, setProducts] = useState([]),
    [promotions, setPromotions] = useState([]),
    [shipping, setShipping] = useState([]),
    [items, setItems] = useState([]),
    [user, setUser] = useState(null),
    [addresses, setAddresses] = useState([]);
  const [cartSummary, setCartSummary] = useState(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(()=>{const selected=new URLSearchParams(location.search).get("category");return categories.includes(selected)?selected:"All"}),
    [sort, setSort] = useState("name");
  const [register, setRegister] = useState(false),
    [auth, setAuth] = useState({ email: "", password: "", name: "" });
  const [address, setAddress] = useState({ country: "ZA" }),
    [shippingId, setShippingId] = useState(""),
    [code, setCode] = useState(""),
    [discountError, setDiscountError] = useState(""),
    [review, setReview] = useState(null);
  const [orders, setOrders] = useState([]),
    [detail, setDetail] = useState(null),
    [admin, setAdmin] = useState(null),
    [notifications, setNotifications] = useState([]);
  const [orderFilter, setOrderFilter] = useState(""),
    [statusFilter, setStatusFilter] = useState("All");
  async function refresh() {
    const [p, c, m] = await Promise.all([
      api("/products"),
      api("/cart"),
      api("/me"),
    ]);
    setProducts(p.products);
    shared.setCatalogue(p.products);
    setPromotions(p.promotions || []);
    setShipping(p.shipping);
    setShippingId((s) => s || p.shipping[0]?.id || "");
    setItems(c.items);
    setCartSummary(c.summary);
    setUser(m.user);
    setAddresses(m.addresses);
    return m.user;
  }
  useEffect(()=>setProducts(shared.catalogue),[shared.catalogue]);
  useEffect(()=>{if(shared.cartItems){setItems(shared.cartItems);setCartSummary(shared.cartSummary)}},[shared.cartItems,shared.cartSummary]);
  useEffect(()=>shared.setCartCount(items.reduce((n,i)=>n+i.quantity,0)),[items, shared.setCartCount]);
  useEffect(()=>shared.setUser(user),[user, shared.setUser]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const account = await refresh();
        if (path.startsWith("/shop/orders/")) {
          const d = await api(`/orders/${path.split("/")[3]}`);
          if (alive) setDetail(d);
        }
        if (path === "/shop/account" && account) {
          const d = await api("/orders");
          if (alive) setOrders(d.orders);
        }
        if (path === "/shop/admin" && account?.role === "admin") {
          const [a, o, n] = await Promise.all([
            api("/admin/products"),
            api("/admin/orders"),
            api("/admin/notifications"),
          ]);
          if (alive) {
            setAdmin(a);
            setOrders(o.orders);
            setNotifications(n.notifications);
          }
        }
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [path]);
  useEffect(() => {
    if (detail?.order.status === "paid") shared.refreshProducts().catch(()=>{});
    if (!detail || detail.order.status !== "pending") return;
    const interval = setInterval(async () => {
      try {
        setDetail(await api(`/orders/${detail.order.id}`));
      } catch {
        /* A manual refresh remains available. */
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [detail?.order.id, detail?.order.status]);
  async function run(action) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      await shared.refreshProducts().catch(()=>{});
      setBusy(false);
    }
  }
  async function quantity(variantId, quantity) {
    await run(async () => {
      const c = await api("/cart", "PUT", { variantId, quantity });
      setItems(c.items);
    setCartSummary(c.summary);
      setReview(null);
    });
  }
  async function add(variantId) {
    await run(async () => {
      const c = await api("/cart", "PUT", {
        variantId,
        quantity: (items.find((i) => i.id === variantId)?.quantity || 0) + 1,
      });
      setItems(c.items);
    setCartSummary(c.summary);
      setMessage("Added to your cart.");
    });
  }
  function authenticate(e) {
    e.preventDefault();
    run(async () => {
      await api(
        `/auth/${register ? "register" : "login"}`,
        "POST",
        register ? auth : { email: auth.email, password: auth.password },
      );
      window.location.assign("/shop/checkout");
    });
  }
  function requestReview(e) {
    e.preventDefault();
    run(async () => {
      setReview(null);setDiscountError('');
      try {setReview(await api("/quote", "POST", { shippingId, code:code.trim() }));}
      catch(e){if(e.code==='INVALID_PROMOTION')setDiscountError(e.message);else throw e;}

    });
  }
  function pay(orderId) {
    run(async () => {
      const payment = await api(`/orders/${orderId}/pay`, "POST", {});
      if (payment.action !== "https://sandbox.payfast.co.za/eng/process")
        throw Error("Unexpected payment destination");
      const form = document.createElement("form");
      form.method = "POST";
      form.action = payment.action;
      for (const [name, value] of Object.entries(payment.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    });
  }
  const filtered = products
    .filter(
      (p) =>
        (category === "All" || p.tags?.includes(category) || p.category === category) &&
        `${p.name} ${p.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : (sort === "price-desc" ? -1 : 1) *
          ((a.variants.length ? Math.min(...a.variants.map(v=>v.price)) : Infinity) -
            (b.variants.length ? Math.min(...b.variants.map(v=>v.price)) : Infinity)),
    );
  const currentProduct = path.startsWith("/shop/products/")
    ? products.find((p) => p.id === decodeURIComponent(path.split("/")[3]))
    : null;
  const authForm = (
    <section>
      <h1>{register ? "Create your account" : "Sign in"}</h1>
      <p>Your guest cart will follow you into your account.</p>
      <form onSubmit={authenticate}>
        {register && (
          <label>
            Name
            <input
              required
              autoComplete="name"
              value={auth.name}
              onChange={(e) => setAuth({ ...auth, name: e.target.value })}
            />
          </label>
        )}
        <label>
          Email
          <input
            required
            type="email"
            autoComplete="email"
            value={auth.email}
            onChange={(e) => setAuth({ ...auth, email: e.target.value })}
          />
        </label>
        <label>
          Password (12 characters minimum)
          <input
            required
            type="password"
            minLength="12"
            maxLength="128"
            autoComplete={register ? "new-password" : "current-password"}
            value={auth.password}
            onChange={(e) => setAuth({ ...auth, password: e.target.value })}
          />
        </label>
        <button disabled={busy}>{register ? "Register" : "Sign in"}</button>
      </form>
      <button className="secondary" onClick={() => setRegister(!register)}>
        {register ? "Already registered? Sign in" : "Create an account"}
      </button>
    </section>
  );
  return (
    <div className="commerce">
      <main>
        <p className="commerce-notice">
          SANDBOX CHECKOUT · No live payments in this release
        </p>
        {error && (
          <p role="alert">
            {error}{" "}
            <button onClick={() => window.location.reload()}>Reload</button>
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {loading ? (
          <p role="status">Loading your Royal Priesthood shop…</p>
        ) : (
          <>
            {path === "/shop" && (
              <>
                <h1>Shop the collection</h1>
                {promotions.length > 0 && (
                  <section aria-label="Current promotions">
                    {promotions.map((p) => (
                      <p key={p.code}>
                        {p.percent}% off items with code{" "}
                        <strong>{p.code}</strong>. Delivery is calculated
                        separately.
                      </p>
                    ))}
                  </section>
                )}
                <div className="commerce-toolbar">
                  <label>
                    Search products
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <label>
                    Category
                    <select aria-label="Category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Sort
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="name">Name</option>
                      <option value="price-asc">Price: low to high</option>
                      <option value="price-desc">Price: high to low</option>
                    </select>
                  </label>
                </div>
                <p className="catalogue-count" data-testid="shop-count">{filtered.length} products · {products.filter(p=>p.approved).length} approved catalogue references</p>
                {filtered.length ? (
                  <div className="commerce-grid product-grid">
                    {filtered.map((p, index) => (
                      <Product key={p.id} product={p} index={index} onAdd={add} busy={busy} />
                    ))}
                  </div>
                ) : (
                  <p>
                    No products available for this selection.{" "}
                    <a href="/shop">
                      Explore the catalogue and save your favourites.
                    </a>
                  </p>
                )}
              </>
            )}
            {path.startsWith("/shop/products/") &&
              (currentProduct ? (
                <>
                  <a href="/shop">← Collection</a>
                  <Product product={currentProduct} onAdd={add} busy={busy} />
                  <a href="/shop/cart">View cart and checkout →</a>
                </>
              ) : (
                <p>
                  This product is not available for purchase.{" "}
                  <a href="/shop">Browse Shop</a>
                </p>
              ))}
            {path === "/shop/cart" && (
              <>
                <h1>Your shopping cart</h1>
                {items.length ? (
                  <>
                    <ul className="commerce-cart">
                      {items.map((i) => (
                        <li key={i.id}>
                          <CatalogueImage src={i.image} alt="" style={{width:64,height:80,objectFit:"cover"}}/>
                          <div>
                            <a href={`/shop/products/${i.product_id}`}>
                              {i.name}
                            </a>
                            <p>
                              {i.size} / {i.colour} · {money(i.price)}
                            </p>
                          </div>
                          <label>
                            Quantity for {i.name}
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={i.quantity}
                              disabled={busy}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                if (Number.isInteger(n) && n >= 1 && n <= 99)
                                  quantity(i.id, n);
                              }}
                            />
                          </label>
                          <button
                            disabled={busy}
                            onClick={() => quantity(i.id, 0)}
                          >
                            Remove {i.name}
                          </button>
                          <strong>{money(i.price * i.quantity)}</strong>
                        </li>
                      ))}
                    </ul>
                    <p>
                      Items subtotal:{" "}
                      {money(
                        items.reduce((n, i) => n + i.quantity * i.price, 0),
                      )}
                       . Shipping: calculated after delivery selection. Grand total: confirmed by the server at checkout.
                    </p>
                    {cartSummary && <p>Discount estimate −{money(cartSummary.discount)} · Shipping estimate ({cartSummary.shippingName}): {money(cartSummary.shipping)} · Estimated grand total: {money(cartSummary.total)}. Final delivery and discounts confirmed at checkout.</p>}
                    <a className="commerce-button" href="/shop/checkout">
                      Proceed to checkout
                    </a>
                  </>
                ) : (
                  <p>
                    Your cart is empty. <a href="/shop">Browse products</a>
                  </p>
                )}
              </>
            )}
            {path === "/shop/login" && authForm}
            {path === "/shop/checkout" && (
              <>
                <h1>Checkout</h1>
                <ol className="commerce-progress">
                  <li aria-current={!user ? "step" : undefined}>1. Account</li>
                  <li aria-current={user && !review ? "step" : undefined}>
                    2. Delivery
                  </li>
                  <li aria-current={review ? "step" : undefined}>3. Review</li>
                  <li>4. Secure payment</li>
                </ol>
                {!user ? (
                  authForm
                ) : !items.length ? (
                  <p>
                    Your cart is empty.{" "}
                    <a href="/shop/account">Check pending orders</a> or{" "}
                    <a href="/shop">continue shopping</a>.
                  </p>
                ) : (
                  <form onSubmit={requestReview}>
                    <label>
                      Saved delivery address
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          setAddress(
                            addresses.find((a) => a.id === e.target.value) || {
                              country: "ZA",
                            },
                          );
                          setReview(null);
                        }}
                      >
                        <option value="">Enter a new address</option>
                        {addresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}, {a.line1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <fieldset disabled={busy} onChange={() => setReview(null)}>
                      <legend>Delivery details</legend>
                      <AddressFields values={address} setValues={setAddress} />
                      <label>
                        Delivery option
                        <select
                          required
                          value={shippingId}
                          onChange={(e) => setShippingId(e.target.value)}
                        >
                          <option value="">Choose delivery</option>
                          {shipping.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} — {money(s.price)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Discount code (optional)
                        <input
                          maxLength="40"
                          aria-invalid={!!discountError}
                          aria-describedby={discountError?"discount-feedback":undefined}
                          value={code}
                          onChange={(e) =>
                            {setCode(e.target.value.toUpperCase());setDiscountError("");setReview(null)}
                          }
                        />
                      </label>
                    </fieldset>
                    {discountError && <p id="discount-feedback" role="alert">{discountError}</p>}
                    <button disabled={busy}>Review order</button>
                    {review && (
                      <section className="commerce-summary">
                        <h2>Review your order</h2>
                        {review.items.map((i) => (
                          <p key={i.id}>
                            {i.quantity} × {i.name}, {i.size}, {i.colour} —{" "}
                            {money(i.quantity * i.price)}
                          </p>
                        ))}
                        <p>Subtotal {money(review.subtotal)}</p>
                        <p>Discount −{money(review.discount)}</p>
                        <p>Delivery {money(review.shipping)}</p>
                        <strong>Total {money(review.total)}</strong>
                        <p>
                          Deliver to {address.name}, {address.line1},{" "}
                          {address.city}, {address.postal_code}.
                        </p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              let key =
                                sessionStorage.getItem("rp:checkout-key");
                              if (!key) {
                                key = crypto.randomUUID();
                                sessionStorage.setItem("rp:checkout-key", key);
                              }
                              const r = await api("/checkout", "POST", {
                                address,
                                shippingId,
                                code:code.trim(),
                                idempotencyKey: key,
                              });
                              sessionStorage.removeItem("rp:checkout-key");
                              window.location.assign(
                                `/shop/orders/${r.order.id}`,
                              );
                            })
                          }
                        >
                          Place pending order
                        </button>
                      </section>
                    )}
                  </form>
                )}
              </>
            )}
            {path === "/shop/account" &&
              (!user ? (
                authForm
              ) : (
                <>
                  <h1>My account</h1>
                  <p>
                    {user.name} · {user.email}
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = new FormData(e.currentTarget).get("name");
                      run(async () => {
                        await api("/me", "PATCH", { name });
                        await refresh();
                        setMessage("Profile updated.");
                      });
                    }}
                  >
                    <label>
                      Profile name
                      <input name="name" defaultValue={user.name} required />
                    </label>
                    <button disabled={busy}>Save profile</button>
                  </form>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await api("/auth/logout", "POST", {});
                        window.location.assign("/shop");
                      })
                    }
                  >
                    Sign out
                  </button>
                  <h2>Delivery addresses</h2>
                  {addresses.map((a) => (
                    <p key={a.id}>
                      {a.name} — {a.line1}, {a.city}, {a.postal_code}
                    </p>
                  ))}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(async () => {
                        await api("/addresses", "POST", address);
                        await refresh();
                        setMessage("Address saved.");
                      });
                    }}
                  >
                    <AddressFields values={address} setValues={setAddress} />
                    <button disabled={busy}>Save address</button>
                  </form>
                  <h2>Order history</h2>
                  {orders.length ? (
                    orders.map((o) => (
                      <p key={o.id}>
                        <a href={`/shop/orders/${o.id}`}>
                          {o.id.slice(0, 12)} · {money(o.total)} · {o.status} ·{" "}
                          {new Date(o.created_at).toLocaleDateString()}
                        </a>
                      </p>
                    ))
                  ) : (
                    <p>No orders yet.</p>
                  )}
                </>
              ))}
            {path.startsWith("/shop/orders/") && detail && (
              <>
                <h1>
                  {["paid", "dispatched", "delivered"].includes(
                    detail.order.status,
                  )
                    ? "Order confirmed"
                    : "Order status"}
                </h1>
                <p>Reference: {detail.order.id}</p>
                <p role="status">
                  Order: {detail.order.status} · Payment:{" "}
                  {detail.payment.status}
                </p>
                {new URLSearchParams(location.search).has("payment") && (
                  <p>
                    Returning from PayFast does not confirm payment. This page
                    checks verified payment status automatically. If you
                    cancelled at PayFast, your order remains pending until
                    explicitly cancelled below.
                  </p>
                )}
                {detail.items.map((i) => (
                  <p key={i.variant_id}>
                    {i.quantity} × {i.name} / {i.size} / {i.colour} —{" "}
                    {money(i.unit_price * i.quantity)}
                  </p>
                ))}
                <p>
                  Subtotal {money(detail.order.subtotal)} · Discount −
                  {money(detail.order.discount)} · Delivery{" "}
                  {money(detail.order.shipping)}
                </p>
                <p>Total {money(detail.order.total)}</p>
                <p>
                  Delivery: {detail.order.address.line1},{" "}
                  {detail.order.address.city}
                </p>
                <p>Tracking: {detail.order.tracking || "Awaiting dispatch"}</p>
                <p>
                  Payment reference:{" "}
                  {detail.payment.provider_id ||
                    "Awaiting gateway confirmation"}
                </p>
                <p>Receipt SENT means accepted by the email provider; mailbox delivery is not confirmed here.</p>
                {detail.notifications.map((n) => (
                  <p key={n.kind}>
                    {n.kind === "receipt"
                      ? "Confirmation and receipt email"
                      : n.kind}
                    : {n.kind === "receipt" ? ({pending:"RECEIPT_QUEUED",sent:"RECEIPT_SENT",failed:"RECEIPT_FAILED"}[n.status] || n.status) : n.status}
                  </p>
                ))}
                {detail.order.status === "pending" && (
                  <>
                    <button
                      disabled={busy || detail.payment.status !== "pending"}
                      onClick={() => pay(detail.order.id)}
                    >
                      Continue to PayFast sandbox
                    </button>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await api(
                            `/orders/${detail.order.id}/cancel`,
                            "POST",
                            {},
                          );
                          setDetail(await api(`/orders/${detail.order.id}`));
                        })
                      }
                    >
                      Cancel pending order
                    </button>
                  </>
                )}
                <p>
                  <a href="/shop/account">Order history</a>
                </p>
              </>
            )}
            {path === "/shop/admin" &&
              (user?.role !== "admin" ? (
                <p>Administrator access required.</p>
              ) : (
                admin && (
                  <>
                    <h1>Commerce administration</h1>
                    <p>
                      Only configure approved saleable items. Prices use ZAR
                      cents. Existing image paths preserve approved assets.
                    </p>
                    <h2>Products and images</h2>
                    <AdminForm
                      fields={[
                        "id",
                        "name",
                        "description",
                        "image",
                        "category",
                        "active",
                      ]}
                      initial={{
                        category: "T-Shirts",
                        active: false,
                        image: "/images/catalog/09_Tshirt_Front_Black.png",
                      }}
                      records={admin.products}
                      endpoint="/admin/products"
                      run={run}
                      busy={busy}
                    />
                    <h2>Variants and available inventory</h2>
                    <p>
                      Stock is available inventory after pending reservations.
                      SKU size and colour are immutable after creation.
                    </p>
                    <AdminForm
                      fields={[
                        "id",
                        "product_id",
                        "size",
                        "colour",
                        "price",
                        "stock",
                      ]}
                      records={admin.variants}
                      endpoint="/admin/variants"
                      run={run}
                      busy={busy}
                    />
                    <h2>Promotions</h2>
                    <AdminForm
                      fields={["code", "percent", "active", "expires_at"]}
                      records={admin.promotions}
                      endpoint="/admin/promotions"
                      initial={{ active: true }}
                      run={run}
                      busy={busy}
                    />
                    <h2>Shipping</h2>
                    <AdminForm
                      fields={["id", "name", "price", "active"]}
                      records={admin.shipping}
                      endpoint="/admin/shipping"
                      initial={{ active: true }}
                      run={run}
                      busy={busy}
                    />
                    <h2>Orders</h2>
                    <label>
                      Search orders
                      <input
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value)}
                      />
                    </label>
                    <label>
                      Order status filter
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        {[
                          "All",
                          "pending",
                          "paid",
                          "dispatched",
                          "delivered",
                          "cancelled",
                          "refunded",
                        ].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    {orders
                      .filter(
                        (o) =>
                          `${o.id} ${o.email}`
                            .toLowerCase()
                            .includes(orderFilter.toLowerCase()) &&
                          (statusFilter === "All" || o.status === statusFilter),
                      )
                      .map((o) => (
                        <article className="commerce-summary" key={o.id}>
                          <h3>
                            {o.id.slice(0, 12)} · {o.email}
                          </h3>
                          <p>
                            {o.status} · {money(o.total)} · Payment:{" "}
                            {o.payment_status} ·{" "}
                            {o.provider_id || "No gateway reference"}
                          </p>
                          <p>
                            {o.address.name}, {o.address.line1},{" "}
                            {o.address.city}, {o.address.postal_code}
                          </p>
                          <button
                            disabled={busy}
                            onClick={() =>
                              run(async () =>
                                setDetail(await api(`/admin/orders/${o.id}`)),
                              )
                            }
                          >
                            View order items
                          </button>
                          {detail?.order.id === o.id &&
                            detail.items.map((i) => (
                              <p key={i.variant_id}>
                                {i.quantity} × {i.name}, {i.size}, {i.colour} —{" "}
                                {money(i.unit_price * i.quantity)}
                              </p>
                            ))}
                          {["paid", "dispatched"].includes(o.status) && (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const tracking = new FormData(
                                  e.currentTarget,
                                ).get("tracking");
                                run(async () => {
                                  await api(`/admin/orders/${o.id}`, "PATCH", {
                                    status:
                                      o.status === "paid"
                                        ? "dispatched"
                                        : "delivered",
                                    tracking,
                                  });
                                  setOrders(
                                    (await api("/admin/orders")).orders,
                                  );
                                  setMessage("Fulfilment updated.");
                                });
                              }}
                            >
                              <label>
                                Courier tracking reference
                                <input
                                  name="tracking"
                                  required
                                  minLength="3"
                                  defaultValue={o.tracking || ""}
                                />
                              </label>
                              <button disabled={busy}>
                                Mark{" "}
                                {o.status === "paid"
                                  ? "dispatched"
                                  : "delivered"}
                              </button>
                            </form>
                          )}
                        </article>
                      ))}
                    <h2>Notification delivery</h2>
                    {notifications.map((n) => (
                      <p key={n.id}>
                        {n.kind} · {n.status} · attempts {n.attempts}{" "}
                        {n.last_error}
                      </p>
                    ))}
                    <button
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          const result = await api(
                            "/admin/notifications/retry",
                            "POST",
                            {},
                          );
                          setMessage(
                            result.configured
                              ? `Sent ${result.sent} notifications.`
                              : "Email provider is not configured.",
                          );
                          setNotifications(
                            (await api("/admin/notifications")).notifications,
                          );
                        })
                      }
                    >
                      Process due notifications
                    </button>
                  </>
                )
              ))}
            {![
              "/shop",
              "/shop/cart",
              "/shop/login",
              "/shop/checkout",
              "/shop/account",
              "/shop/admin",
            ].includes(path) &&
              !path.startsWith("/shop/products/") &&
              !path.startsWith("/shop/orders/") && (
                <p>
                  Page not found. <a href="/shop">Return to shop</a>
                </p>
              )}
          </>
        )}
      </main>

    </div>
  );
}
function AdminForm({ fields, records, endpoint, run, busy, initial = {} }) {
  const [values, setValues] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const data = Object.fromEntries(
            fields.map((k) => [
              k,
              ["price", "stock", "percent"].includes(k)
                ? Number(values[k])
                : k === "active"
                  ? !!values[k]
                  : values[k] || "",
            ]),
          );
          await api(endpoint, "PUT", data);
          window.location.reload();
        });
      }}
    >
      <label>
        Edit existing or create new
        <select
          value=""
          onChange={(e) =>
            setValues(
              records.find((r) => (r.id || r.code) === e.target.value) ||
                initial,
            )
          }
        >
          <option value="">Select a record</option>
          {records.map((r) => (
            <option key={r.id || r.code} value={r.id || r.code}>
              {r.name || r.id || r.code}
            </option>
          ))}
        </select>
      </label>
      <div className="commerce-fields">
        {fields.map((k) => (
          <label key={k}>
            {k.replaceAll("_", " ")}
            {k === "active" ? (
              <input
                type="checkbox"
                checked={!!values[k]}
                onChange={(e) =>
                  setValues({ ...values, [k]: e.target.checked })
                }
              />
            ) : (
              <input
                required={k !== "description"}
                type={
                  ["price", "stock", "percent"].includes(k) ? "number" : "text"
                }
                value={values[k] ?? ""}
                onChange={(e) => setValues({ ...values, [k]: e.target.value })}
              />
            )}
          </label>
        ))}
      </div>
      <button disabled={busy}>Save {endpoint.split("/").at(-1)}</button>
    </form>
  );
}
