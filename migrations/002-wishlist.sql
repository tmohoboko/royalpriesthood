-- Additive: no historical enquiry data is changed.
CREATE TABLE IF NOT EXISTS wishlist_items (
  id text PRIMARY KEY,
  cart_id text NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  variant_id text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1 CHECK(quantity BETWEEN 1 AND 99),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cart_id,product_id,variant_id)
);
