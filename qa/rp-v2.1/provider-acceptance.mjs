// Real browser submission to PayFast sandbox; no synthetic callbacks.
import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
const origin='https://royalpriesthood-commerce-preview-tmdev.vercel.app', dir='qa/rp-v2.1';
const state=JSON.parse(await readFile('.env.rpv21-uat.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:'/home/tmdev012/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const context=await browser.newContext({viewport:{width:1280,height:1000}});
await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue({headers:{...route.request().headers(),'x-vercel-trusted-oidc-idp-token':process.env.VERCEL_OIDC_TOKEN}}):route.continue());
const page=await context.newPage();
try{
 await page.goto(origin+'/shop');
 await page.evaluate(async account=>{const r=await fetch('/api/commerce/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:account.email,password:account.password})});if(!r.ok)throw Error('Login failed')},state.account);
 await page.goto(origin+'/shop/orders/'+state.orderId);
 await page.getByRole('button',{name:'Continue to PayFast sandbox'}).click();
 await page.waitForURL('https://sandbox.payfast.co.za/**');await page.waitForLoadState('networkidle');
 await page.screenshot({path:dir+'/ui-acceptance-screenshots/payfast-initial.png',fullPage:true});
 console.log('PROVIDER_PAGE '+await page.locator('body').innerText());
 if(process.env.RP_PROVIDER_COMPLETE==='1'){
   await page.getByRole('button',{name:'Complete Payment',exact:true}).click();
   await page.waitForLoadState('networkidle');
   await page.screenshot({path:dir+'/ui-acceptance-screenshots/payfast-complete.png',fullPage:true});
   const providerText=await page.locator('body').innerText();
   console.log('PROVIDER_RESULT '+providerText);
   await writeFile(dir+'/provider-result.json',JSON.stringify({orderId:state.orderId,paymentId:state.paymentId,amountCents:10000,realBrowserSubmission:true,actualCompletePaymentClicked:true,noMocks:true,providerText},null,2)+'\n');
   await page.goto(origin+'/shop/orders/'+state.orderId);
   console.log('APP_RETURN '+await page.locator('body').innerText());
   await page.screenshot({path:dir+'/ui-acceptance-screenshots/hosted-order-after-provider.png',fullPage:true});
 }
 await writeFile(dir+'/provider-initial.json',JSON.stringify({orderId:state.orderId,paymentId:state.paymentId,providerOrigin:new URL(page.url()).origin,realBrowserSubmission:true,noMocks:true,amountCents:10000},null,2)+'\n');
}finally{await browser.close()}
