import { z, ZodError } from "zod";
import { resolveCatalogue } from "../src/catalogue.js";
import { database, rows, one, transaction } from "./db.js";
import {
  id,
  hash,
  fail,
  totals,
  credentialsSchema,
  passwordHash,
  passwordValid,
  addressSchema,
} from "./domain.js";
import {
  cart,
  mergeCart,
  quote,
  checkout,
  cancelOrder,
  applyNotification,
  fulfil,
} from "./service.js";
import { hostedPayment, verifyNotification, paymentConfig } from "./payfast.js";
import { enqueue, deliverNotifications } from "./notifications.js";
const cookieName = "rp_session";
const cookies = (req) =>
  Object.fromEntries(
    (req.headers.get("cookie") || "")
      .split(";")
      .filter((s) => s.includes("="))
      .map((s) => {
        const p = s.trim().indexOf("=");
        return [s.trim().slice(0, p), s.trim().slice(p + 1)];
      }),
  );
const productSchema = z.object({
  id: z.string().regex(/^[\w-]{1,80}$/),
  name: z.string().trim().min(2).max(150),
  description: z.string().max(3000).default(""),
  image: z
    .string()
    .regex(/^\/images\/[\w/.-]+\.(png|jpg|jpeg|webp)$/i)
    .refine((v) => !v.includes(".."), "Image must be an approved asset path"),
  category: z.enum(["Women", "Men", "T-Shirts", "Accessories", "Hats"]),
  active: z.boolean(),
});
const variantSchema = z.object({
  id: z.string().regex(/^[\w-]{1,80}$/),
  product_id: z.string().max(80),
  size: z.string().trim().min(1).max(20),
  colour: z.string().trim().min(1).max(60),
  price: z.number().int().min(500).max(100000000),
  stock: z.number().int().min(0).max(1000000),
});
export function createHandler({
  db: provided,
  env = process.env,
  verify = verifyNotification,
  fetcher = fetch,
} = {}) {
  return async function handle(req, sourceIp = "") {
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const cookie = (name, value, age) =>
      headers.append(
        "Set-Cookie",
        `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${env.VERCEL || env.APP_ORIGIN?.startsWith("https:") ? "; Secure" : ""}`,
      );
    const json = (value, status = 200) =>
      new Response(JSON.stringify(value), { status, headers });
    let paymentRef;
    try {
      const url = new URL(req.url),
        path = url.pathname.replace(/^\/api\/commerce/, "") || "/";
      if (path === "/health")
        return json({
          ok: true,
          databaseConfigured: !!(provided || env.DATABASE_URL),
          paymentMode: env.PAYFAST_MODE === "sandbox" ? "sandbox" : "disabled",
        });
      const mutating = !["GET", "HEAD"].includes(req.method);
      const webhook = path === "/payfast/notify" && req.method === "POST";
      if (mutating && !webhook) {
        const origin = req.headers.get("origin");
        if (origin !== (env.APP_ORIGIN || url.origin))
          fail(403, "ORIGIN_REJECTED", "Request origin is not allowed");
        if (!req.headers.get("content-type")?.includes("application/json"))
          fail(415, "CONTENT_TYPE", "JSON request required");
      }
      if (Number(req.headers.get("content-length") || 0) > 65536)
        fail(413, "BODY_TOO_LARGE", "Request is too large");
      let body = {};
      if (mutating) {
        const raw = await req.text();
        if (Buffer.byteLength(raw) > 65536)
          fail(413, "BODY_TOO_LARGE", "Request is too large");
        if (webhook) {
          const params = new URLSearchParams(raw);
          if (new Set(params.keys()).size !== [...params.keys()].length)
            fail(400, "DUPLICATE_FIELDS", "Duplicate payment fields");
          body = Object.fromEntries(params);
        } else {
          try {
            body = JSON.parse(raw || "{}");
          } catch {
            fail(400, "INVALID_JSON", "Invalid JSON request");
          }
        }
      }
      const db = provided || (await database());
      if (webhook) {
        paymentRef = body.m_payment_id;
        await verify(body, sourceIp, env, fetcher);
        const result = await applyNotification(db, body);
        await deliverNotifications(db, env, fetcher);
        return json(result);
      }
      const cs = cookies(req);
      const user = cs[cookieName]
        ? await one(
            db,
            "SELECT u.id,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()",
            [hash(cs[cookieName])],
          )
        : null;
      const requireUser = () => {
        if (!user) fail(401, "UNAUTHENTICATED", "Please sign in to continue");
        return user;
      };
      const requireAdmin = () => {
        requireUser();
        if (user.role !== "admin")
          fail(403, "FORBIDDEN", "Administrator access required");
      };
      const ensureCart = async () => {
        if (user) {
          let c = await one(db, "SELECT id FROM carts WHERE user_id=$1", [
            user.id,
          ]);
          if (!c) {
            await db.query(
              "INSERT INTO carts(id,user_id) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING",
              [id(), user.id],
            );
            c = await one(db, "SELECT id FROM carts WHERE user_id=$1", [
              user.id,
            ]);
          }
          return c.id;
        }
        const found = cs.rp_cart
          ? await one(
              db,
              "SELECT id FROM carts WHERE id=$1 AND user_id IS NULL",
              [cs.rp_cart],
            )
          : null;
        if (found) return found.id;
        const c = id();
        await db.query("INSERT INTO carts(id) VALUES($1)", [c]);
        cookie("rp_cart", c, 2592000);
        return c;
      };
      if (path === "/auth/register" || path === "/auth/login") {
        if (req.method !== "POST")
          fail(405, "METHOD_NOT_ALLOWED", "POST required");
        const input = (
          path.endsWith("register")
            ? credentialsSchema
            : credentialsSchema.omit({ name: true })
        ).parse(body);
        for (const [rateKey, limit] of [
          [hash(`ip:${sourceIp}`), 60],
          [hash(`email:${input.email}`), 12],
        ]) {
          const rate = await one(
            db,
            "INSERT INTO auth_attempts(key,attempts) VALUES($1,1) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN auth_attempts.window_at<now()-interval '15 minutes' THEN 1 ELSE auth_attempts.attempts+1 END, window_at=CASE WHEN auth_attempts.window_at<now()-interval '15 minutes' THEN now() ELSE auth_attempts.window_at END RETURNING attempts",
            [rateKey],
          );
          if (rate.attempts > limit)
            fail(
              429,
              "RATE_LIMITED",
              "Too many attempts. Try again in 15 minutes",
            );
        }
        let account = await one(db, "SELECT * FROM users WHERE email=$1", [
          input.email,
        ]);
        if (path.endsWith("register")) {
          if (!input.name) fail(400, "VALIDATION", "Name is required");
          if (account)
            fail(
              409,
              "ACCOUNT_EXISTS",
              "An account with this email already exists",
            );
          const encoded = await passwordHash(input.password);
          account = await transaction(db, async (tx) => {
            const a = await one(
              tx,
              "INSERT INTO users(id,email,password_hash,name) VALUES($1,$2,$3,$4) RETURNING *",
              [id(), input.email, encoded, input.name],
            );
            await enqueue(tx, a.id, "welcome");
            return a;
          });
        } else if (
          !account ||
          !(await passwordValid(input.password, account.password_hash))
        )
          fail(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
        await mergeCart(db, cs.rp_cart || "", account.id);
        const token = id();
        await db.query(
          "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",
          [hash(token), account.id],
        );
        cookie(cookieName, token, 604800);
        cookie("rp_cart", "", 0);
        await deliverNotifications(db, env, fetcher);
        return json({
          user: {
            id: account.id,
            name: account.name,
            email: account.email,
            role: account.role,
          },
        });
      }
      if (path === "/auth/logout" && req.method === "POST") {
        if (cs[cookieName])
          await db.query("DELETE FROM sessions WHERE token_hash=$1", [
            hash(cs[cookieName]),
          ]);
        cookie(cookieName, "", 0);
        return json({ ok: true });
      }
      if (path === "/me" && req.method === "GET")
        return json({
          user,
          addresses: user
            ? await rows(db, "SELECT * FROM addresses WHERE user_id=$1", [
                user.id,
              ])
            : [],
        });
      if (path === "/me" && req.method === "PATCH") {
        requireUser();
        const { name } = z
          .object({ name: z.string().trim().min(2).max(100) })
          .parse(body);
        await db.query("UPDATE users SET name=$1 WHERE id=$2", [name, user.id]);
        return json({ ok: true });
      }
      if (path === "/addresses" && req.method === "POST") {
        requireUser();
        const a = addressSchema.parse(body);
        await db.query(
          "INSERT INTO addresses(id,user_id,name,phone,line1,city,province,postal_code,country) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [
            id(),
            user.id,
            ...[
              "name",
              "phone",
              "line1",
              "city",
              "province",
              "postal_code",
              "country",
            ].map((k) => a[k]),
          ],
        );
        return json({ ok: true }, 201);
      }
      if (path === "/products" && req.method === "GET") {
        const list = await rows(
          db,
          "SELECT * FROM products ORDER BY name",
        );
        const variants = await rows(
          db,
          "SELECT v.* FROM variants v JOIN products p ON p.id=v.product_id WHERE p.active=true ORDER BY v.id",
        );
        return json({
          products: resolveCatalogue(list, variants),
          shipping: await rows(
            db,
            "SELECT * FROM shipping_options WHERE active=true ORDER BY price",
          ),
          promotions: await rows(
            db,
            "SELECT code,percent FROM promotions WHERE active=true AND expires_at>now() ORDER BY code",
          ),
        });
      }
      const cartResponse = async (cartId) => {
        const items = await cart(db,cartId);
        const shipping = await one(db,"SELECT id,name,price FROM shipping_options WHERE active=true ORDER BY price,id LIMIT 1");
        return {items, summary: items.length && shipping ? {...totals(items,0,shipping.price),shippingId:shipping.id,shippingName:shipping.name,estimated:true} : null};
      };
      if (path === "/wishlist" || path.startsWith("/wishlist/")) {
        const cartId = await ensureCart();
        const list = async () => ({ items: await rows(db,
          "SELECT id,product_id,variant_id,quantity,created_at,updated_at FROM wishlist_items WHERE cart_id=$1 ORDER BY created_at,id", [cartId]) });
        if (path === "/wishlist" && req.method === "GET") return json(await list());
        if (path === "/wishlist" && req.method === "POST") {
          const input = z.object({ productId:z.string().min(1).max(80), variantId:z.string().max(80).default(""), quantity:z.number().int().min(1).max(99).default(1) }).parse(body);
          const records = await rows(db,"SELECT * FROM products WHERE id=$1",[input.productId]);
          if (!resolveCatalogue(records).some(p=>p.id===input.productId)) fail(404,"NOT_FOUND","Product not found");
          if (input.variantId && !await one(db,"SELECT id FROM variants WHERE id=$1 AND product_id=$2",[input.variantId,input.productId])) fail(400,"INVALID_VARIANT","Variant does not belong to this product");
          await db.query("INSERT INTO wishlist_items(id,cart_id,product_id,variant_id,quantity) VALUES($1,$2,$3,$4,$5) ON CONFLICT(cart_id,product_id,variant_id) DO UPDATE SET quantity=excluded.quantity,updated_at=now()",[id(),cartId,input.productId,input.variantId,input.quantity]);
          return json(await list());
        }
        const route = path.match(/^\/wishlist\/([a-f0-9]{48})(\/move)?$/);
        if (route && ((!route[2] && req.method === "DELETE") || (route[2] && req.method === "POST"))) {
          await transaction(db,async tx=>{
            await tx.query("SELECT id FROM carts WHERE id=$1 FOR UPDATE",[cartId]);
            const item=await one(tx,"SELECT * FROM wishlist_items WHERE id=$1 AND cart_id=$2 FOR UPDATE",[route[1],cartId]);
            if(!item) fail(404,"NOT_FOUND","Saved item not found");
            if(route[2]) {
              const v=await one(tx,"SELECT v.*,p.active FROM variants v JOIN products p ON p.id=v.product_id WHERE v.id=$1 AND v.product_id=$2 FOR UPDATE OF v",[item.variant_id,item.product_id]);
              const existing=await one(tx,"SELECT quantity FROM cart_items WHERE cart_id=$1 AND variant_id=$2",[cartId,item.variant_id]);
              const quantity=(existing?.quantity||0)+item.quantity;
              if(!v || !v.active || !Number.isInteger(v.price) || v.price<500 || quantity>99 || quantity>v.stock) fail(409,"UNAVAILABLE","Current price, variant or inventory is unavailable. Item remains saved.");
              await tx.query("INSERT INTO cart_items(cart_id,variant_id,quantity) VALUES($1,$2,$3) ON CONFLICT(cart_id,variant_id) DO UPDATE SET quantity=excluded.quantity",[cartId,v.id,quantity]);
            }
            await tx.query("DELETE FROM wishlist_items WHERE id=$1 AND cart_id=$2",[item.id,cartId]);
          });
          return json({...await list(),cart:await cart(db,cartId)});
        }
        fail(405,"METHOD_NOT_ALLOWED","Unsupported wishlist operation");
      }
      if (path === "/cart" && req.method === "GET")
        return json(await cartResponse(await ensureCart()));
      if (path === "/cart" && req.method === "PUT") {
        const input = z
          .object({
            variantId: z.string().max(80),
            quantity: z.number().int().min(0).max(99),
          })
          .parse(body);
        const cartId = await ensureCart();
        await transaction(db, async (tx) => {
          await tx.query("SELECT id FROM carts WHERE id=$1 FOR UPDATE", [
            cartId,
          ]);
          const v = await one(
            tx,
            "SELECT v.*,p.active FROM variants v JOIN products p ON p.id=v.product_id WHERE v.id=$1",
            [input.variantId],
          );
          if (!v) fail(404, "NOT_FOUND", "Variant not found");
          if (input.quantity && (!v.active || !Number.isInteger(v.price) || v.price < 500 || input.quantity > v.stock))
            fail(409, "OUT_OF_STOCK", "Requested quantity is unavailable");
          if (!input.quantity)
            await tx.query(
              "DELETE FROM cart_items WHERE cart_id=$1 AND variant_id=$2",
              [cartId, input.variantId],
            );
          else
            await tx.query(
              "INSERT INTO cart_items(cart_id,variant_id,quantity) VALUES($1,$2,$3) ON CONFLICT(cart_id,variant_id) DO UPDATE SET quantity=excluded.quantity",
              [cartId, input.variantId, input.quantity],
            );
        });
        return json(await cartResponse(cartId));
      }
      if (path === "/quote" && req.method === "POST") {
        requireUser();
        const input = z
          .object({
            shippingId: z.string().max(100),
            code: z.string().max(40).default(""),
          })
          .parse(body);
        return json(
          await quote(db, await ensureCart(), input.shippingId, input.code),
        );
      }
      if (path === "/checkout" && req.method === "POST") {
        requireUser();
        paymentConfig(env);
        return json(
          { order: await checkout(db, user, await ensureCart(), body) },
          201,
        );
      }
      if (path === "/orders" && req.method === "GET") {
        requireUser();
        return json({
          orders: await rows(
            db,
            "SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC",
            [user.id],
          ),
        });
      }
      const orderRoute = path.match(
        /^\/orders\/([a-f0-9]{48})(?:\/(pay|cancel))?$/,
      );
      if (orderRoute) {
        requireUser();
        const order = await one(
          db,
          "SELECT * FROM orders WHERE id=$1 AND user_id=$2",
          [orderRoute[1], user.id],
        );
        if (!order) fail(404, "NOT_FOUND", "Order not found");
        if (req.method === "POST" && orderRoute[2] === "cancel")
          return json({ order: await cancelOrder(db, user.id, order.id) });
        const payment = await one(
          db,
          "SELECT * FROM payments WHERE order_id=$1",
          [order.id],
        );
        if (req.method === "POST" && orderRoute[2] === "pay")
          return json(
            await transaction(db, async (tx) => {
              const lockedOrder = await one(
                tx,
                "SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE",
                [order.id, user.id],
              );
              const lockedPayment = await one(
                tx,
                "SELECT * FROM payments WHERE order_id=$1 FOR UPDATE",
                [order.id],
              );
              if (lockedOrder.status !== "pending")
                fail(409, "INVALID_TRANSITION", "Order cannot be paid");
              if (new Date(lockedOrder.expires_at) < new Date())
                fail(
                  409,
                  "ORDER_EXPIRED",
                  "Payment window expired. Cancel this order and start again",
                );
              if (lockedPayment.status !== "pending")
                fail(
                  409,
                  "PAYMENT_REVIEW",
                  "This payment requires reconciliation before another attempt",
                );
              const hosted = hostedPayment(
                lockedOrder,
                lockedPayment,
                user,
                env,
              );
              await tx.query(
                "UPDATE payments SET initiated_at=COALESCE(initiated_at,now()) WHERE id=$1",
                [lockedPayment.id],
              );
              return hosted;
            }),
          );
        if (req.method === "GET" && !orderRoute[2])
          return json({
            order,
            items: await rows(
              db,
              "SELECT * FROM order_items WHERE order_id=$1",
              [order.id],
            ),
            payment: {
              status: payment.status,
              provider_id: payment.provider_id,
            },
            notifications: await rows(
              db,
              "SELECT kind,status,sent_at FROM notifications WHERE order_id=$1",
              [order.id],
            ),
          });
      }
      if (path.startsWith("/admin/")) {
        requireAdmin();
        if (path === "/admin/products" && req.method === "GET")
          return json({
            products: await rows(db, "SELECT * FROM products ORDER BY id"),
            variants: await rows(db, "SELECT * FROM variants ORDER BY id"),
            promotions: await rows(db, "SELECT * FROM promotions"),
            shipping: await rows(db, "SELECT * FROM shipping_options"),
          });
        if (path === "/admin/products" && req.method === "PUT") {
          const p = productSchema.parse(body);
          await db.query(
            "INSERT INTO products(id,name,description,image,category,active) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,image=excluded.image,category=excluded.category,active=excluded.active",
            Object.values(p),
          );
          return json({ ok: true });
        }
        if (path === "/admin/variants" && req.method === "PUT") {
          const v = variantSchema.parse(body);
          await db.query(
            "INSERT INTO variants(id,product_id,size,colour,price,stock) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET price=excluded.price,stock=excluded.stock WHERE variants.product_id=excluded.product_id AND variants.size=excluded.size AND variants.colour=excluded.colour",
            Object.values(v),
          );
          return json({ ok: true });
        }
        if (path === "/admin/promotions" && req.method === "PUT") {
          const p = z
            .object({
              code: z.string().regex(/^[A-Z0-9-]{2,40}$/),
              percent: z.number().int().min(1).max(100),
              active: z.boolean(),
              expires_at: z.iso.datetime(),
            })
            .parse(body);
          await db.query(
            "INSERT INTO promotions(code,percent,active,expires_at) VALUES($1,$2,$3,$4) ON CONFLICT(code) DO UPDATE SET percent=excluded.percent,active=excluded.active,expires_at=excluded.expires_at",
            Object.values(p),
          );
          return json({ ok: true });
        }
        if (path === "/admin/shipping" && req.method === "PUT") {
          const s = z
            .object({
              id: z.string().regex(/^[\w-]{1,80}$/),
              name: z.string().min(2).max(100),
              price: z.number().int().min(0).max(100000),
              active: z.boolean(),
            })
            .parse(body);
          await db.query(
            "INSERT INTO shipping_options(id,name,price,active) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET name=excluded.name,price=excluded.price,active=excluded.active",
            Object.values(s),
          );
          return json({ ok: true });
        }
        if (path === "/admin/orders" && req.method === "GET")
          return json({
            orders: await rows(
              db,
              "SELECT o.*,u.email,p.status AS payment_status,p.provider_id FROM orders o JOIN users u ON u.id=o.user_id JOIN payments p ON p.order_id=o.id ORDER BY o.created_at DESC LIMIT 200",
            ),
          });
        const fulfilRoute = path.match(/^\/admin\/orders\/([a-f0-9]{48})$/);
        if (fulfilRoute && req.method === "GET") {
          const order = await one(db, "SELECT * FROM orders WHERE id=$1", [
            fulfilRoute[1],
          ]);
          if (!order) fail(404, "NOT_FOUND", "Order not found");
          return json({
            order,
            items: await rows(
              db,
              "SELECT * FROM order_items WHERE order_id=$1",
              [order.id],
            ),
          });
        }
        if (fulfilRoute && req.method === "PATCH") {
          const result = await fulfil(db, fulfilRoute[1], body);
          await deliverNotifications(db, env, fetcher);
          return json(result);
        }
        if (path === "/admin/notifications" && req.method === "GET")
          return json({
            notifications: await rows(
              db,
              "SELECT id,kind,status,attempts,next_attempt_at,last_error FROM notifications ORDER BY next_attempt_at DESC LIMIT 100",
            ),
          });
        if (path === "/admin/notifications/retry" && req.method === "POST")
          return json(await deliverNotifications(db, env, fetcher));
      }
      fail(404, "NOT_FOUND", "Endpoint not found");
    } catch (e) {
      if (paymentRef)
        console.warn(
          JSON.stringify({
            event: "payment_notification_rejected",
            code: e.code || "REJECTED",
            payment: /^[a-f0-9]{48}$/.test(paymentRef) ? paymentRef : "invalid",
          }),
        );
      if (e instanceof ZodError)
        return json(
          {
            error: {
              code: "VALIDATION",
              message: e.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; "),
            },
          },
          400,
        );
      if (e.code === "23505")
        return json(
          {
            error: { code: "CONFLICT", message: "This record already exists" },
          },
          409,
        );
      if (e.code === "23503")
        return json(
          {
            error: {
              code: "INVALID_REFERENCE",
              message: "Referenced record does not exist",
            },
          },
          400,
        );
      if (!e.status)
        console.error(
          JSON.stringify({
            event: "commerce_error",
            code: e.code || "INTERNAL_ERROR",
          }),
        );
      return json(
        {
          error: {
            code: e.status ? e.code : "INTERNAL_ERROR",
            message: e.status
              ? e.message
              : "An unexpected error occurred. Please try again.",
          },
        },
        e.status || 500,
      );
    }
  };
}
