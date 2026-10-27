import { chromium } from '/home/tmdev012/Reception/royalpriesthood-commerce/node_modules/playwright-core/index.mjs';
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
const origin='https://royalpriesthood-commerce-preview-tmdev.vercel.app';
const results=[];
function check(name,condition){results.push({name,passed:!!condition});if(!condition)throw Error(`Failed: ${name}`);console.log(`PASS ${name}`)}
if(!process.env.VERCEL_OIDC_TOKEN)throw Error('Local project OIDC token missing');
const browser=await chromium.launch({headless:true,executablePath:'/home/tmdev012/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('**/*',async route=>{const req=route.request();if(new URL(req.url()).origin===origin)await route.continue({headers:{...req.headers(),'x-vercel-trusted-oidc-idp-token':process.env.VERCEL_OIDC_TOKEN}});else await route.continue()});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const path of ['/shop','/shop/checkout','/shop/account','/shop/products/unavailable','/shop/orders/unavailable']){
   const response=await page.goto(origin+path);await page.waitForLoadState('networkidle');
   check(`direct navigation ${path}`,response.status()===200&&(await page.locator('body').innerText()).includes('Royal Priesthood'));
 }
 await page.goto(origin+'/shop');await page.waitForLoadState('networkidle');
 const api=async(path,method='GET',data)=>page.evaluate(async({path,method,data})=>{const r=await fetch('/api/commerce'+path,{method,headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json()}},{path,method,data});
 let r=await api('/health');check('health, database configured, payments disabled',r.status===200&&r.data.databaseConfigured===true&&r.data.paymentMode==='disabled');
 r=await api('/products');check('real database catalogue (inactive products)',r.status===200&&r.data.products.length===0&&r.data.shipping.length===0);
 r=await api('/admin/products');check('anonymous admin rejected',r.status===401);
 const account={name:'Preview QA Customer',email:`preview-qa-${Date.now()}@example.test`,password:randomBytes(24).toString('hex')};
 r=await api('/auth/register','POST',account);check('hosted customer registration',r.status===200&&r.data.user?.role==='customer');
 const session=(await context.cookies()).find(c=>c.name==='rp_session');check('secure HttpOnly session cookie',session?.httpOnly&&session?.secure&&session?.sameSite==='Lax');
 await page.reload();await page.waitForLoadState('networkidle');r=await api('/me');check('session survives reload',r.status===200&&r.data.user?.email===account.email);
 r=await api('/addresses','POST',{name:'Preview QA Customer',phone:'0820000000',line1:'1 Test Street',city:'Johannesburg',province:'Gauteng',postal_code:'2000',country:'ZA'});check('save delivery address',r.status===201);
 r=await api('/me');check('persisted delivery address',r.status===200&&r.data.addresses.length===1);
 r=await api('/orders');check('customer order history',r.status===200&&r.data.orders.length===0);
 r=await api('/admin/products');check('customer admin rejected',r.status===403);
 r=await api('/auth/logout','POST',{});check('logout',r.status===200);
 r=await api('/me');check('session revoked',r.status===200&&r.data.user===null);
 r=await api('/auth/login','POST',{email:account.email,password:account.password});check('hosted customer login',r.status===200&&r.data.user?.role==='customer');
 r=await api('/me');check('address retained across login',r.status===200&&r.data.addresses.length===1);
 await page.goto(origin+'/shop/account');await page.waitForLoadState('networkidle');await page.screenshot({path:'qa/commerce-preview/desktop-account.png',fullPage:true});
 await page.setViewportSize({width:375,height:812});await page.goto(origin+'/shop');await page.waitForLoadState('networkidle');check('mobile shop has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'qa/commerce-preview/mobile-shop.png',fullPage:true});
 check('no uncaught browser errors',errors.length===0);
 await api('/auth/logout','POST',{});
 await writeFile('qa/commerce-preview/hosted-smoke.json',JSON.stringify({origin,deployment:'dpl_D9pfef8FbRdDsAsqaLz12tcRqjKn',implementationCommit:'3d70341f66351976b19520c69be02428813337f4',results,payment:'disabled; no gateway or email mock injected into deployed application',testData:'One synthetic example.test customer and delivery address retained in isolated preview database; no admin or order created.'},null,2)+'\n');
}finally{await browser.close()}
