-- Additive metadata; original commercial records keep false/null defaults.
ALTER TABLE products
 ADD COLUMN IF NOT EXISTS sandbox_only boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS reference_product_id text REFERENCES products(id),
 ADD COLUMN IF NOT EXISTS fixture_version text;
