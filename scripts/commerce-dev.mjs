import http from "node:http";
import { createServer } from "vite";
import commerce from "../api/commerce.js";
if (process.env.VERCEL) throw Error("Development server is local only");
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "spa",
});
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/commerce"))
    commerce(req, res).catch(() => {
      res.statusCode = 500;
      res.end("API failure");
    });
  else vite.middlewares(req, res);
});
server.listen(5173, "127.0.0.1", () =>
  console.log(
    "Local development: http://127.0.0.1:5173; configure DATABASE_URL and APP_ORIGIN in .env",
  ),
);
