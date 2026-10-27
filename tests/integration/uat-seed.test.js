import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {seedFixtures} from '../../server/fixtures.js';
import {products} from '../../src/data.js';
import {uatEnabled,requirePurchasableEnvironment} from '../../server/uat-policy.js';
test('RP211 UAT seed is guarded, additive, replayable without restock, and reversibly deactivated',async()=>{
 const db=new PGlite();
 try{
  await seedFixtures(db);
  for(const p of products)await db.query('INSERT INTO products(id,name,image,category) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[p.id,p.name,p.image,p.department]);
  const before=(await db.query('SELECT * FROM products ORDER BY id')).rows;
  const seed=await readFile(new URL('../../scripts/commerce-uat211-seed.sql',import.meta.url),'utf8');
  await assert.rejects(()=>db.exec(seed),/guard required/);
  // The embedded database has a different fixed database name; hosted execution uses the unmodified guard.
  const name=(await db.query('SELECT current_database() AS name')).rows[0].name;
  const localSql=sql=>sql.replace("current_database() <> 'royalpriesthood'",`current_database() <> '${name}'`);
  const apply=sql=>db.transaction(async tx=>{await tx.query("SELECT set_config('app.rp_uat_target','br-calm-rice-b7mcxqw7',true)");await tx.exec(localSql(sql));});
  await apply(seed);
  let fixtures=(await db.query("SELECT * FROM products WHERE fixture_version='RP211-UAT-1' ORDER BY id")).rows;
  assert.equal(fixtures.length,5);assert.equal(new Set(fixtures.map(p=>p.category)).size,5);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM variants WHERE product_id LIKE 'RP-UAT211-%'")).rows[0].n,10);
  assert.deepEqual((await db.query("SELECT * FROM products WHERE fixture_version IS NULL ORDER BY id")).rows,before);
  await db.query("UPDATE variants SET stock=4 WHERE id='RP-UAT211-W01-M'");await apply(seed);
  assert.equal((await db.query("SELECT stock FROM variants WHERE id='RP-UAT211-W01-M'")).rows[0].stock,4);
  await apply(await readFile(new URL('../../scripts/commerce-uat211-reverse.sql',import.meta.url),'utf8'));
  assert.equal((await db.query("SELECT count(*)::int AS n FROM products WHERE fixture_version='RP211-UAT-1' AND active")).rows[0].n,0);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM variants WHERE product_id LIKE 'RP-UAT211-%'")).rows[0].n,10);
  await apply(seed);assert.equal((await db.query("SELECT stock FROM variants WHERE id='RP-UAT211-W01-M'")).rows[0].stock,4);
  await db.query("UPDATE variants SET price=999 WHERE id='RP-UAT211-W01-M'");await assert.rejects(()=>apply(seed),/collision/);
 }finally{await db.close()}
});
test('RP211 synthetic product guard permits only sandbox Preview/test and rejects production',()=>{
 assert.equal(uatEnabled({PAYFAST_MODE:'sandbox',VERCEL_ENV:'preview'}),true);
 for(const env of [{PAYFAST_MODE:'live',VERCEL_ENV:'preview'},{PAYFAST_MODE:'sandbox',VERCEL_ENV:'production'},{PAYFAST_MODE:'sandbox',NODE_ENV:'test',VERCEL:'1',VERCEL_ENV:'production'}])assert.equal(uatEnabled(env),false);
 assert.throws(()=>requirePurchasableEnvironment([{sandbox_only:true}],false),e=>e.code==='UAT_PREVIEW_ONLY');
});
