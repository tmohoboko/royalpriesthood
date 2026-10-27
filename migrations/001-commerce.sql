CREATE TABLE IF NOT EXISTS users (
 id text PRIMARY KEY, email text UNIQUE NOT NULL, password_hash text NOT NULL,
 name text NOT NULL, role text NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id), expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS categories (id text PRIMARY KEY, name text NOT NULL);
CREATE TABLE IF NOT EXISTS products (id text PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '', image text NOT NULL, category text NOT NULL REFERENCES categories(id), active boolean NOT NULL DEFAULT false);
CREATE TABLE IF NOT EXISTS variants (id text PRIMARY KEY, product_id text NOT NULL REFERENCES products(id), size text NOT NULL, colour text NOT NULL, price integer NOT NULL CHECK(price>=500 AND price<=100000000), stock integer NOT NULL DEFAULT 0 CHECK(stock>=0), UNIQUE(product_id,size,colour));
CREATE TABLE IF NOT EXISTS carts (id text PRIMARY KEY, user_id text UNIQUE REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS cart_items (cart_id text REFERENCES carts(id) ON DELETE CASCADE, variant_id text REFERENCES variants(id), quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 99), PRIMARY KEY(cart_id,variant_id));
CREATE TABLE IF NOT EXISTS addresses (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id), name text NOT NULL, phone text NOT NULL, line1 text NOT NULL, city text NOT NULL, province text NOT NULL, postal_code text NOT NULL, country text NOT NULL DEFAULT 'ZA');
CREATE TABLE IF NOT EXISTS shipping_options (id text PRIMARY KEY, name text NOT NULL, price integer NOT NULL CHECK(price>=0), active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS promotions (code text PRIMARY KEY, percent integer NOT NULL CHECK(percent BETWEEN 1 AND 100), active boolean NOT NULL DEFAULT true, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS orders (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id), idempotency_key text NOT NULL, request_hash text NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','dispatched','delivered','cancelled','refunded')), subtotal integer NOT NULL, discount integer NOT NULL, shipping integer NOT NULL, total integer NOT NULL, address jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '30 minutes', tracking text, UNIQUE(user_id,idempotency_key));
CREATE TABLE IF NOT EXISTS order_items (order_id text REFERENCES orders(id), variant_id text REFERENCES variants(id), name text NOT NULL, size text NOT NULL, colour text NOT NULL, quantity integer NOT NULL, unit_price integer NOT NULL, PRIMARY KEY(order_id,variant_id));
CREATE TABLE IF NOT EXISTS payments (id text PRIMARY KEY, order_id text UNIQUE NOT NULL REFERENCES orders(id), provider text NOT NULL DEFAULT 'payfast', status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','cancelled','refunded')), provider_id text UNIQUE, initiated_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS payment_events (event_key text PRIMARY KEY, payment_id text NOT NULL REFERENCES payments(id), status text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS notifications (id text PRIMARY KEY, dedupe_key text UNIQUE NOT NULL, user_id text NOT NULL REFERENCES users(id), order_id text REFERENCES orders(id), kind text NOT NULL, payload jsonb NOT NULL DEFAULT '{}', status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed')), attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, last_error text);
CREATE TABLE IF NOT EXISTS auth_attempts (key text PRIMARY KEY, attempts integer NOT NULL, window_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS orders_user_created ON orders(user_id,created_at);
CREATE INDEX IF NOT EXISTS notification_pending ON notifications(status,next_attempt_at);
INSERT INTO categories VALUES ('Women','Women'),('Men','Men'),('T-Shirts','T-Shirts'),('Accessories','Accessories'),('Hats','Hats') ON CONFLICT DO NOTHING;
