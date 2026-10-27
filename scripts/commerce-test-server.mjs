import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { createHandler } from "../server/handler.js";
import { seedFixtures, fixtureEnv } from "../server/fixtures.js";
import {
  notificationSignature,
  verifyNotification,
} from "../server/payfast.js";
import { one } from "../server/db.js";
if (process.env.VERCEL || process.env.NODE_ENV === "production")
  throw Error("Test server must never run in deployment");
const db = new PGlite();
await seedFixtures(db);
const sent = [];
const handle = createHandler({
  db,
  env: fixtureEnv,
  verify: (data, sourceIp, env) =>
    verifyNotification(
      data,
      sourceIp,
      env,
      async () => new Response("VALID"),
      async () => [sourceIp],
    ),
  fetcher: async (url, opts) => {
    if (url !== "https://api.resend.com/emails")
      throw Error("Unexpected mock URL");
    sent.push(JSON.parse(opts.body));
    return new Response('{"id":"test-email"}', { status: 200 });
  },
});
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, fixtureEnv.APP_ORIGIN);
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks);
    if (url.pathname === "/__test/payment" && req.method === "POST") {
      const { paymentId, status } = JSON.parse(raw.toString());
      const p = await one(db, "SELECT * FROM payments WHERE id=$1", [
        paymentId,
      ]);
      const order = await one(db, "SELECT * FROM orders WHERE id=$1", [
        p.order_id,
      ]);
      const data = {
        merchant_id: fixtureEnv.PAYFAST_MERCHANT_ID,
        m_payment_id: p.id,
        pf_payment_id: `fixture-${p.id}`,
        amount_gross: (order.total / 100).toFixed(2),
        payment_status: status,
      };
      data.signature = notificationSignature(
        data,
        fixtureEnv.PAYFAST_PASSPHRASE,
      );
      const result = await handle(
        new Request(`${fixtureEnv.APP_ORIGIN}/api/commerce/payfast/notify`, {
          method: "POST",
          body: new URLSearchParams(data),
        }),
      );
      res.writeHead(result.status, { "Content-Type": "application/json" });
      res.end(await result.text());
      return;
    }
    if (url.pathname === "/__test/emails") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(sent));
      return;
    }
    if (url.pathname.startsWith("/api/commerce")) {
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        ...(!["GET", "HEAD"].includes(req.method) ? { body: raw } : {}),
      });
      const response = await handle(request, req.socket.remoteAddress);
      res.statusCode = response.status;
      response.headers.forEach((v, k) => {
        if (k !== "set-cookie") res.setHeader(k, v);
      });
      if (response.headers.getSetCookie().length)
        res.setHeader("Set-Cookie", response.headers.getSetCookie());
      res.end(await response.text());
      return;
    }
    const root = resolve("dist");
    let file = resolve(root, "." + decodeURIComponent(url.pathname));
    if (!file.startsWith(root + "/")) file = root + "/index.html";
    try {
      if (!(await stat(file)).isFile()) file = root + "/index.html";
    } catch {
      file = root + "/index.html";
    }
    const mime = {
      ".js": "text/javascript",
      ".css": "text/css",
      ".html": "text/html",
      ".png": "image/png",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
    });
    res.end(await readFile(file));
  } catch (e) {
    console.error(e.message);
    res.writeHead(500);
    res.end("Local test server failure");
  }
});
server.listen(4173, "127.0.0.1", () =>
  console.log(
    "LOCAL FIXTURE SERVER: sandbox gateway and email mocks, no real payments or email delivery",
  ),
);
process.on("SIGTERM", () =>
  server.close(async () => {
    await db.close();
    process.exit(0);
  }),
);
