-- RP211-UAT-1: synthetic ZAR fixtures, isolated Preview only. Never reset existing inventory.
DO $$ BEGIN
 IF current_database() <> 'royalpriesthood' OR current_setting('app.rp_uat_target',true) IS DISTINCT FROM 'br-calm-rice-b7mcxqw7' THEN
  RAISE EXCEPTION 'Explicit isolated Preview database/branch guard required';
 END IF;
END $$;
UPDATE products SET active=false WHERE fixture_version='RP211-UAT-1' AND sandbox_only=true;
-- Preserve products, variants, consumed inventory, saved items and historical order references.
