// Genuine hosted API/browser acceptance. No payment, database or email mocks.
import {chromium,expect} from '@playwright/test';
import {randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
const origin='https://royalpriesthood-commerce-preview-tmdev.vercel.app';
const results=[];const evidence='qa/rp-v2.1';
const account={name:'RP v2.1 Acceptance',email:`rpv21-${Date.now()}@example.invalid`,password:randomBytes(24).toString('hex')};
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/home/tmdev012/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue({headers:{...route.request().headers(),'x-vercel-trusted-oidc-idp-token':process.env.VERCEL_OIDC_TOKEN}}):route.continue());
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const api=(path,method='GET',data)=>page.evaluate(async({path,method,data})=>{const r=await fetch('/api/commerce'+path,{method,headers:method!=='GET'?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json()}},{path,method,data});
function check(id,condition,detail){if(!condition)throw Error(`${id}: ${detail}`);results.push({id,status:'PASS',detail});console.log('PASS '+id+' '+detail)}
async function save(){await page.getByRole('button',{name:'Save to Wishlist',exact:true}).click();await expect(page.getByRole('status')).toContainText('Saved');}
try{
 await page.goto(origin);await expect(page.locator('header')).toHaveCount(1);await page.goto(origin+'/shop');await expect(page.locator('.commerce-product')).toHaveCount(17);check('SMK-01',true,'Homepage and Shop share one approved shell and catalogue');
 await expect(page.locator('body')).not.toContainText(/enquiry/i);await expect(page.getByRole('button',{name:'Open Wishlist with 0 items'})).toBeVisible();await expect(page.getByRole('link',{name:'Shopping cart with 0 items'})).toBeVisible();check('SMK-02',true,'Wishlist and Cart present; Enquiry absent');
 const products=(await api('/products')).data.products;const direct=products.find(p=>p.id==='RP-QA-001');check('SMK-03',direct?.variants[0].price===10000&&products.filter(p=>p.purchaseMode!=='direct').length===16,'Approved imagery; configured R100 test variant only; unpriced products have no Cart action');
 await page.screenshot({path:evidence+'/ui-acceptance-screenshots/hosted-desktop-shop.png',fullPage:true});
 await page.goto(origin+'/shop/products/RP-W01');await save();await expect(page.getByRole('button',{name:'Open Wishlist with 1 items'})).toBeVisible();check('SMK-04',true,'Save updates unique-entry counter');
 await page.getByRole('button',{name:'Open Wishlist with 1 items'}).click();await expect(page.getByRole('dialog')).toContainText("Women's Black Statement");check('SMK-05',true,'Drawer displays saved approved product and pending availability');
 await page.getByRole('dialog').getByRole('button',{name:/^Remove /}).click();await expect(page.getByRole('button',{name:'Open Wishlist with 0 items'})).toBeVisible();check('SMK-06',true,'Removal persisted and header decremented');
 await page.keyboard.press('Escape');await save();await page.reload();await expect(page.getByRole('button',{name:'Open Wishlist with 1 items'})).toBeVisible();
 await page.goto(origin+'/shop/products/RP-QA-001');await save();
 await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Added to your cart.'})).toBeVisible();
 let r=await api('/auth/register','POST',account);await writeFile('.env.rpv21-uat.json',JSON.stringify({account}),{mode:0o600});check('SMK-11',r.status===200&&(await api('/cart')).data.items[0]?.quantity===1,'Registration preserves guest Cart');
 await api('/auth/logout','POST',{});await api('/wishlist','POST',{productId:'RP-W01'});r=await api('/auth/login','POST',{email:account.email,password:account.password});check('SMK-07',r.status===200&&(await api('/wishlist')).data.items.length===2,'Refresh/navigation persistence; login merges duplicate guest entry once');
 const saved=(await api('/wishlist')).data.items;
 await page.goto(origin+'/shop/cart');await page.getByRole('button',{name:'Open Wishlist with 2 items'}).click();await page.getByRole('button',{name:'Move to Cart'}).click();await expect(page.getByRole('link',{name:'Shopping cart with 2 items'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByLabel('Quantity for Royal Priesthood Test T-Shirt')).toHaveValue('2');check('SMK-08',true,'Move revalidates current variant/stock and updates open Cart and counter');
 r=await api('/cart');check('SMK-09',r.data.items[0].quantity===2&&r.data.summary.subtotal===20000&&r.data.summary.shipping===0&&r.data.summary.total===20000,'Server-calculated cart subtotal, shipping estimate and grand total');
 const invalid=await api('/cart','PUT',{variantId:'RP-QA-001',quantity:99});const valid=await api('/cart','PUT',{variantId:'RP-QA-001',quantity:1});check('SMK-10',invalid.status===409&&valid.status===200&&valid.data.items[0].quantity===1,'Unavailable quantity rejected; valid quantity recovers');
 // Independent guest cannot remove or move another customer entry.
 const outsider=await browser.newContext();await outsider.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue({headers:{...route.request().headers(),'x-vercel-trusted-oidc-idp-token':process.env.VERCEL_OIDC_TOKEN}}):route.continue());const op=await outsider.newPage();await op.goto(origin+'/shop');
 const denied=await op.evaluate(async id=>{const r=await fetch('/api/commerce/wishlist/'+id,{method:'DELETE',headers:{'Content-Type':'application/json'}});return r.status},saved[0].id);check('EXT-W01',denied===404,'Other guest cannot delete customer saved entry');await outsider.close();
 await page.goto(origin+'/shop/checkout');await page.getByLabel('Recipient name').fill(account.name);await page.getByLabel('Phone',{exact:true}).fill('0820000000');await page.getByLabel('Street address').fill('1 Sandbox Test Street');await page.getByLabel('City',{exact:true}).fill('Johannesburg');await page.getByLabel('Postal code').fill('2000');await page.getByLabel('Province').selectOption('Gauteng');await page.getByRole('button',{name:'Review order',exact:true}).click();await expect(page.getByRole('heading',{name:'Review your order'})).toBeVisible();await page.screenshot({path:evidence+'/ui-acceptance-screenshots/hosted-checkout-review.png',fullPage:true});await page.getByRole('button',{name:'Place pending order'}).click();await page.waitForURL('**/shop/orders/*');
 const orderId=page.url().split('/').at(-1);r=await api('/orders/'+orderId);check('SMK-12',r.data.order.status==='pending'&&r.data.order.total===10000,'Persisted PENDING order R100 before payment');
 const payment=await api('/orders/'+orderId+'/pay','POST',{});check('SMK-13',payment.status===200&&payment.data.action==='https://sandbox.payfast.co.za/eng/process'&&payment.data.fields.amount==='100.00'&&payment.data.fields.m_payment_id&&payment.data.fields.merchant_id,'Real sandbox endpoint, merchant configured, reference and R100 amount; credentials omitted');
 await writeFile('.env.rpv21-uat.json',JSON.stringify({account,orderId,paymentId:payment.data.fields.m_payment_id}),{mode:0o600});
 await page.setViewportSize({width:375,height:850});await page.getByRole('button',{name:'Open Wishlist with 1 items'}).click();await expect(page.getByRole('button',{name:'Close Wishlist'})).toBeFocused();await page.keyboard.press('Shift+Tab');check('EXT-W04',await page.getByRole('dialog').evaluate(e=>e.contains(document.activeElement)),'Mobile focus trap');await page.screenshot({path:evidence+'/ui-acceptance-screenshots/hosted-mobile-wishlist.png'});await page.keyboard.press('Escape');
 check('EXT-UI',errors.length===0&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No browser exceptions or mobile overflow');
 console.log('Pending order ready for genuine PayFast acceptance: '+orderId);
} catch(e){results.push({id:'EXECUTION',status:'FAIL',detail:e.message});console.error(e.message);process.exitCode=1;}
finally{await writeFile(evidence+'/hosted-smoke.json',JSON.stringify({origin,results,genuineProvider:false,note:'Payment initiation is real; genuine provider completion is a separate acceptance step.'},null,2)+'\n');await browser.close();}
