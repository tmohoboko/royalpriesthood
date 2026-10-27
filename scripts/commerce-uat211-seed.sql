-- RP211-UAT-1: synthetic ZAR fixtures, isolated Preview only. Never reset existing inventory.
DO $$ BEGIN
 IF current_database() <> 'royalpriesthood' OR current_setting('app.rp_uat_target',true) IS DISTINCT FROM 'br-calm-rice-b7mcxqw7' THEN
  RAISE EXCEPTION 'Explicit isolated Preview database/branch guard required';
 END IF;
END $$;
INSERT INTO products(id,name,image,category,description,active,sandbox_only,reference_product_id,fixture_version)
 SELECT 'RP-UAT211-W01',name || ' — UAT TEST',image,category,'RP211-UAT-1 synthetic ZAR price/inventory. Sandbox only, no physical sale. Reference RP-W01.',true,true,id,'RP211-UAT-1' FROM products WHERE id='RP-W01'
 ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM products WHERE id='RP-UAT211-W01' AND sandbox_only AND fixture_version='RP211-UAT-1' AND reference_product_id='RP-W01') THEN RAISE EXCEPTION 'Fixture identity collision or missing reference: RP-UAT211-W01'; END IF;
END $$;
UPDATE products SET active=true WHERE id='RP-UAT211-W01' AND sandbox_only AND fixture_version='RP211-UAT-1';

INSERT INTO variants(id,product_id,size,colour,price,stock) VALUES('RP-UAT211-W01-M','RP-UAT211-W01','M','Black',12500,6) ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM variants WHERE id='RP-UAT211-W01-M' AND product_id='RP-UAT211-W01' AND size='M' AND colour='Black' AND price=12500) THEN RAISE EXCEPTION 'Fixture variant collision: RP-UAT211-W01-M'; END IF;
END $$;

INSERT INTO variants(id,product_id,size,colour,price,stock) VALUES('RP-UAT211-W01-L','RP-UAT211-W01','L','Gold',13500,6) ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM variants WHERE id='RP-UAT211-W01-L' AND product_id='RP-UAT211-W01' AND size='L' AND colour='Gold' AND price=13500) THEN RAISE EXCEPTION 'Fixture variant collision: RP-UAT211-W01-L'; END IF;
END $$;

INSERT INTO products(id,name,image,category,description,active,sandbox_only,reference_product_id,fixture_version)
 SELECT 'RP-UAT211-M01',name || ' — UAT TEST',image,category,'RP211-UAT-1 synthetic ZAR price/inventory. Sandbox only, no physical sale. Reference RP-M01.',true,true,id,'RP211-UAT-1' FROM products WHERE id='RP-M01'
 ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM products WHERE id='RP-UAT211-M01' AND sandbox_only AND fixture_version='RP211-UAT-1' AND reference_product_id='RP-M01') THEN RAISE EXCEPTION 'Fixture identity collision or missing reference: RP-UAT211-M01'; END IF;
END $$;
UPDATE products SET active=true WHERE id='RP-UAT211-M01' AND sandbox_only AND fixture_version='RP211-UAT-1';

INSERT INTO variants(id,product_id,size,colour,price,stock) VALUES('RP-UAT211-M01-M','RP-UAT211-M01','M','Black',14500,6) ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM variants WHERE id='RP-UAT211-M01-M' AND product_id='RP-UAT211-M01' AND size='M' AND colour='Black' AND price=14500) THEN RAISE EXCEPTION 'Fixture variant collision: RP-UAT211-M01-M'; END IF;
END $$;

INSERT INTO variants(id,product_id,size,colour,price,stock) VALUES('RP-UAT211-M01-L','RP-UAT211-M01','L','Gold',15500,6) ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM variants WHERE id='RP-UAT211-M01-L' AND product_id='RP-UAT211-M01' AND size='L' AND colour='Gold' AND price=15500) THEN RAISE EXCEPTION 'Fixture variant collision: RP-UAT211-M01-L'; END IF;
END $$;

INSERT INTO products(id,name,image,category,description,active,sandbox_only,reference_product_id,fixture_version)
 SELECT 'RP-UAT211-T01',name || ' — UAT TEST',image,category,'RP211-UAT-1 synthetic ZAR price/inventory. Sandbox only, no physical sale. Reference RP-T01.',true,true,id,'RP211-UAT-1' FROM products WHERE id='RP-T01'
 ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM products WHERE id='RP-UAT211-T01' AND sandbox_only AND fixture_version='RP211-UAT-1' AND reference_product_id='RP-T01') THEN RAISE EXCEPTION 'Fixture identity collision or missing reference: RP-UAT211-T01'; END IF;
END $$;
UPDATE products SET active=true WHERE id='RP-UAT211-T01' AND sandbox_only AND fixture_version='RP211-UAT-1';

INSERT INTO variants(id,product_id,size,colour,price,stock) VALUES('RP-UAT211-T01-M','RP-UAT211-T01','M','Black',10000,6) ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM variants WHERE id='RP-UAT211-T01-M' AND product_id='RP-UAT211-T01' AND size='M' AND colour='Black' AND price=10000) THEN RAISE EXCEPTION 'Fixture variant collision: RP-UAT211-T01-M'; END IF;
END $$;

INSERT INTO variants(id,product_id,size,colour,price,stock) VALUES('RP-UAT211-T01-L','RP-UAT211-T01','L','Gold',11000,6) ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM variants WHERE id='RP-UAT211-T01-L' AND product_id='RP-UAT211-T01' AND size='L' AND colour='Gold' AND price=11000) THEN RAISE EXCEPTION 'Fixture variant collision: RP-UAT211-T01-L'; END IF;
END $$;

INSERT INTO products(id,name,image,category,description,active,sandbox_only,reference_product_id,fixture_version)
 SELECT 'RP-UAT211-H01',name || ' — UAT TEST',image,category,'RP211-UAT-1 synthetic ZAR price/inventory. Sandbox only, no physical sale. Reference RP-H01.',true,true,id,'RP211-UAT-1' FROM products WHERE id='RP-H01'
 ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM products WHERE id='RP-UAT211-H01' AND sandbox_only AND fixture_version='RP211-UAT-1' AND reference_product_id='RP-H01') THEN RAISE EXCEPTION 'Fixture identity collision or missing reference: RP-UAT211-H01'; END IF;
END $$;
UPDATE products SET active=true WHERE id='RP-UAT211-H01' AND sandbox_only AND fixture_version='RP211-UAT-1';

INSERT INTO variants(id,product_id,size,colour,price,stock) VALUES('RP-UAT211-H01-M','RP-UAT211-H01','M','Black',7500,6) ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM variants WHERE id='RP-UAT211-H01-M' AND product_id='RP-UAT211-H01' AND size='M' AND colour='Black' AND price=7500) THEN RAISE EXCEPTION 'Fixture variant collision: RP-UAT211-H01-M'; END IF;
END $$;

INSERT INTO variants(id,product_id,size,colour,price,stock) VALUES('RP-UAT211-H01-L','RP-UAT211-H01','L','Gold',8500,6) ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM variants WHERE id='RP-UAT211-H01-L' AND product_id='RP-UAT211-H01' AND size='L' AND colour='Gold' AND price=8500) THEN RAISE EXCEPTION 'Fixture variant collision: RP-UAT211-H01-L'; END IF;
END $$;

INSERT INTO products(id,name,image,category,description,active,sandbox_only,reference_product_id,fixture_version)
 SELECT 'RP-UAT211-A01',name || ' — UAT TEST',image,category,'RP211-UAT-1 synthetic ZAR price/inventory. Sandbox only, no physical sale. Reference RP-A01.',true,true,id,'RP211-UAT-1' FROM products WHERE id='RP-A01'
 ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM products WHERE id='RP-UAT211-A01' AND sandbox_only AND fixture_version='RP211-UAT-1' AND reference_product_id='RP-A01') THEN RAISE EXCEPTION 'Fixture identity collision or missing reference: RP-UAT211-A01'; END IF;
END $$;
UPDATE products SET active=true WHERE id='RP-UAT211-A01' AND sandbox_only AND fixture_version='RP211-UAT-1';

INSERT INTO variants(id,product_id,size,colour,price,stock) VALUES('RP-UAT211-A01-M','RP-UAT211-A01','M','Black',9500,6) ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM variants WHERE id='RP-UAT211-A01-M' AND product_id='RP-UAT211-A01' AND size='M' AND colour='Black' AND price=9500) THEN RAISE EXCEPTION 'Fixture variant collision: RP-UAT211-A01-M'; END IF;
END $$;

INSERT INTO variants(id,product_id,size,colour,price,stock) VALUES('RP-UAT211-A01-L','RP-UAT211-A01','L','Gold',10500,6) ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM variants WHERE id='RP-UAT211-A01-L' AND product_id='RP-UAT211-A01' AND size='L' AND colour='Gold' AND price=10500) THEN RAISE EXCEPTION 'Fixture variant collision: RP-UAT211-A01-L'; END IF;
END $$;
