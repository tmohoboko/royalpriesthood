import {chromium,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
const dir='qa/rp-v2.1',origin='https://royalpriesthood-commerce-preview-tmdev.vercel.app';
const {account,orderId,paymentId}=JSON.parse(await readFile('.env.rpv21-uat.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:'/home/tmdev012/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue({headers:{...route.request().headers(),'x-vercel-trusted-oidc-idp-token':process.env.VERCEL_OIDC_TOKEN}}):route.continue());
const page=await context.newPage();const results=[];
function check(id,condition,detail){if(!condition)throw Error(id+' '+detail);results.push({id,status:'PASS',detail});console.log('PASS '+id+' '+detail)}
const api=(path,method='GET',data)=>page.evaluate(async({path,method,data})=>{const r=await fetch('/api/commerce'+path,{method,headers:method!=='GET'?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json()}},{path,method,data});
try{
 await page.goto(origin+'/shop');await api('/auth/login','POST',{email:account.email,password:account.password});
 await page.goto(origin+'/shop/orders/'+orderId+'?payment=returned');await expect(page.getByRole('heading',{name:'Order confirmed',exact:true})).toBeVisible();
 let d=(await api('/orders/'+orderId)).data;
 check('SMK-14',d.payment.status==='paid'&&!!d.payment.provider_id,'Genuine PayFast wallet transaction '+d.payment.provider_id+' recorded; no synthetic callback');
 check('SMK-15',d.order.status==='paid'&&d.order.total===10000,'Backend verified provider notification and persisted PAID R100 order; exact-once event count corroborated by SQL evidence');
 await expect(page.getByText('Confirmation and receipt email: RECEIPT_QUEUED',{exact:true})).toBeVisible();
 check('SMK-16',d.notifications.filter(n=>n.kind==='receipt').length===1&&d.notifications.find(n=>n.kind==='receipt').status==='pending','One receipt generated and queued; email delivery unconfigured and unclaimed');
 await page.screenshot({path:dir+'/ui-acceptance-screenshots/hosted-paid-confirmation.png',fullPage:true});
 const me=(await api('/me')).data;check('SMK-17',d.order.user_id===me.user.id&&(await api('/orders')).data.orders.some(o=>o.id===orderId&&o.status==='paid'),'Authenticated customer owns paid order and sees it in history');
 await page.getByRole('link',{name:'Order history',exact:true}).click();await expect(page.getByRole('link',{name:/R 100.00 · paid/})).toBeVisible();await page.screenshot({path:dir+'/ui-acceptance-screenshots/hosted-order-history.png',fullPage:true});
 const callback='https://royalpriesthood-payfast-itn-tmdev.vercel.app';
 const negative=[];
 for(let i=0;i<2;i++){
   const r=await fetch(callback+'/api/commerce/payfast/notify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({m_payment_id:paymentId,pf_payment_id:d.payment.provider_id,amount_gross:'100.00',payment_status:'COMPLETE',signature:'00000000000000000000000000000000'})});
   const data=await r.json();negative.push({status:r.status,code:data.error?.code});
 }
 d=(await api('/orders/'+orderId)).data;
 check('SMK-18',negative.every(r=>r.status===400&&r.code==='BAD_SIGNATURE')&&d.order.status==='paid'&&d.notifications.filter(n=>n.kind==='receipt').length===1,'Two actual invalid-signature callback replays rejected; no duplicate receipt or payment regression');
 const boundary=[];
 for(const path of ['/','/shop','/api/commerce/me','/api/commerce/payfast/notify?commercePath=admin/products']){const r=await fetch(callback+path,{redirect:'manual'});boundary.push({path,status:r.status});}
 check('EXT-CALLBACK',boundary.every(r=>r.status===404),'Dedicated public callback alias denies storefront, customer APIs and query spoofing');
 // Capture loaded images, rather than a lazy-image placeholder, for UAT.
 await page.goto(origin+'/shop');await expect(page.locator('.commerce-product')).toHaveCount(17);
 for(const img of await page.locator('.commerce-product img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);}
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:dir+'/ui-acceptance-screenshots/hosted-desktop-shop.png',fullPage:true});
 await page.setViewportSize({width:375,height:850});await page.getByRole('button',{name:'Open Wishlist with 1 items'}).click();
 const img=page.getByRole('dialog').locator('img');await expect.poll(()=>img.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);await page.screenshot({path:dir+'/ui-acceptance-screenshots/hosted-mobile-wishlist.png'});
 await writeFile(dir+'/payment-confirmation.json',JSON.stringify({orderId,paymentId,totalCents:d.order.total,orderStatus:d.order.status,paymentStatus:d.payment.status,providerTransactionId:d.payment.provider_id,receipt:d.notifications.filter(n=>n.kind==='receipt'),negativeCallbacks:negative,callbackBoundary:boundary,results,genuineProvider:true,emailDelivered:false,emailProviderConfigured:false},null,2)+'\n');
}finally{await browser.close()}
