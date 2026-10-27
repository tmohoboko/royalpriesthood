import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const results=[];
function check(name,fn){fn();results.push({name,passed:true});console.log('PASS '+name)}
const db=JSON.parse(await readFile('qa/payment-gate/database-final.json','utf8'));
const paid=db.find(x=>x.id==='e5088faa6dae7ab37d23a2cc1f9836362b081e4197f007fd');
const cancel=db.find(x=>x.id==='a0c58b6385e93eb1d8fe937cd28bba6a7f38d68f16193e41');
check('real sandbox ITN paid expected R5 order',()=>{assert.equal(paid.status,'paid');assert.equal(paid.payment_status,'paid');assert.equal(paid.total,500);assert.equal(paid.provider_id,'3479071')});
check('one verified payment event and one receipt after invalid replays',()=>{assert.equal(paid.verified_events,'1');assert.equal(paid.receipt_count,'1')});
check('email delivery remains blocked and unsent',()=>assert.equal(paid.receipts_sent,'0'));
check('real gateway cancellation did not assert paid or issue receipt',()=>{assert.equal(cancel.status,'pending');assert.equal(cancel.payment_status,'pending');assert.equal(cancel.verified_events,'0');assert.equal(cancel.receipt_count,'0')});
const callback='https://royalpriesthood-payfast-itn-tmdev.vercel.app';
for(const path of ['/','/shop','/api/commerce/me','/api/commerce?commercePath=payfast/notify','/api/commerce/payfast/notify?commercePath=admin/products']){
 const r=await fetch(callback+path,{redirect:'manual'});check('public alias denies '+path,()=>assert.equal(r.status,404));
}
for(let i=0;i<2;i++){
 const r=await fetch(callback+'/api/commerce/payfast/notify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'m_payment_id='+paid.payment_id+'&pf_payment_id=3479071&amount_gross=5.00&payment_status=COMPLETE&signature=00000000000000000000000000000000',redirect:'manual'});
 const value=await r.json();check('actual callback rejects invalid-signature replay '+(i+1),()=>{assert.equal(r.status,400);assert.equal(value.error.code,'BAD_SIGNATURE')});
}
const r=await fetch('https://royalpriesthood-commerce-preview-tmdev.vercel.app/shop',{redirect:'manual'});check('storefront retains Vercel authentication',()=>assert.equal(r.status,302));
await writeFile('qa/payment-gate/live-assertions.json',JSON.stringify({results,passed:results.length,failed:0},null,2)+'\n');
