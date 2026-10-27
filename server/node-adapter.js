// Keep the Vercel IncomingMessage boundary independently testable from business logic.
export function createNodeAdapter(handle, env = process.env) {
  return async function commerce(req, res) {
    try {
      const chunks = [];
      let length = 0;
      for await (const chunk of req) {
        length += chunk.length;
        if (length > 65536) {
          res.statusCode = 413;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: {
                code: "BODY_TOO_LARGE",
                message: "Request is too large",
              },
            }),
          );
          return;
        }
        chunks.push(chunk);
      }
      const origin = env.APP_ORIGIN || `https://${req.headers.host}`;
      const requestUrl = new URL(req.url, origin);
      const routePath =
        req.query?.commercePath || requestUrl.searchParams.get("commercePath");
      if (routePath) {
        requestUrl.pathname = `/api/commerce/${Array.isArray(routePath) ? routePath.join("/") : routePath}`;
        requestUrl.searchParams.delete("commercePath");
      }
      const request = new Request(requestUrl, {
        method: req.method,
        headers: req.headers,
        ...(!["GET", "HEAD"].includes(req.method)
          ? { body: Buffer.concat(chunks) }
          : {}),
      });
      // Vercel ingress supplies this header. Local development uses the socket address.
      const source = env.VERCEL
        ? String(
            req.headers["x-vercel-forwarded-for"] ||
              req.headers["x-forwarded-for"] ||
              "",
          )
            .split(",")[0]
            .trim()
        : req.socket.remoteAddress;
      const response = await handle(request, source);
      res.statusCode = response.status;
      response.headers.forEach((v, k) => {
        if (k !== "set-cookie") res.setHeader(k, v);
      });
      if (response.headers.getSetCookie().length)
        res.setHeader("Set-Cookie", response.headers.getSetCookie());
      res.end(await response.text());
    } catch {
      console.error(JSON.stringify({ event: "commerce_adapter_error" }));
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred. Please try again.",
          },
        }),
      );
    }
  };
}
