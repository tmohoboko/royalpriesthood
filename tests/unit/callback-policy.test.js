import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackHost, callbackBoundary } from '../../server/callback-policy.js';
import { hostedPayment } from '../../server/payfast.js';
const env={VERCEL_ENV:'preview',PAYFAST_MODE:'sandbox',PAYFAST_MERCHANT_ID:'test',PAYFAST_MERCHANT_KEY:'test',PAYFAST_PASSPHRASE:'test',APP_ORIGIN:'https://shop.example',PAYFAST_NOTIFY_ORIGIN:`https://${callbackHost}`};
test('callback alias permits only exact sandbox preview POST and no query',()=>{
 const req=(path,method='POST')=>new Request(`https://${callbackHost}${path}`,{method});
 assert.equal(callbackBoundary(req('/api/commerce/payfast/notify'),env),undefined);
 for(const path of ['/','/shop','/api/commerce/me','/api/commerce?commercePath=payfast/notify','/api/commerce/payfast/notify?commercePath=admin/products','/assets/file.js'])assert.equal(callbackBoundary(req(path),env).status,404);
 for(const method of ['GET','OPTIONS','PUT'])assert.equal(callbackBoundary(req('/api/commerce/payfast/notify',method),env).status,404);
 for(const config of [{},{...env,VERCEL_ENV:'production'},{...env,PAYFAST_MODE:'live'}])assert.equal(callbackBoundary(req('/api/commerce/payfast/notify'),config).status,404);
 assert.equal(callbackBoundary(new Request('https://shop.example/shop'),env),undefined);
});
test('hosted fields use callback-only alias with no bypass secret',()=>{
 const result=hostedPayment({id:'order',total:500},{id:'payment'},{email:'qa@example.test'},env);
 assert.equal(result.fields.notify_url,`https://${callbackHost}/api/commerce/payfast/notify`);
 assert.equal(result.fields.return_url,'https://shop.example/shop/orders/order?payment=returned');
 assert.throws(()=>hostedPayment({id:'order',total:500},{id:'payment'},{email:'qa@example.test'},{...env,VERCEL_ENV:'production'}),/callback origin/);
 assert.throws(()=>hostedPayment({id:'order',total:500},{id:'payment'},{email:'qa@example.test'},{...env,PAYFAST_NOTIFY_ORIGIN:'https://attacker.example'}),/callback origin/);
});
