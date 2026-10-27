import pg from "pg";
let pool;
export async function database() {
  if (!process.env.DATABASE_URL)
    throw Object.assign(new Error("Commerce database is not configured"), {
      status: 503,
      code: "NOT_CONFIGURED",
    });
  const connection = new URL(process.env.DATABASE_URL);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(connection.hostname))
    connection.searchParams.set("sslmode", "verify-full");
  pool ||= new pg.Pool({
    connectionString: connection.toString(),
    max: 4,
    connectionTimeoutMillis: 5000,
  });
  return pool;
}
export async function transaction(db, fn) {
  // pg Pool uses a checked-out connection; PGlite has a native serialized transaction.
  if (db.transaction) return db.transaction(fn);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
export async function rows(db, sql, params = []) {
  return (await db.query(sql, params)).rows;
}
export async function one(db, sql, params = []) {
  return (await rows(db, sql, params))[0];
}
