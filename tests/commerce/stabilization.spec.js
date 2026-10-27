import {test,expect} from '@playwright/test';
test('RP211 canonical Shop navigation preserves departments and legacy product access',async({page})=>{
 await page.goto('/');await expect(page.locator('header .nav a',{hasText:'Catalogue'})).toHaveCount(0);await expect(page.locator('header .nav a',{hasText:'Shop'})).toHaveCount(1);
 for(const path of ['/#catalogue','/catalogue','/catalogue/products/RP-W01']){await page.goto(path);await expect(page).toHaveURL(/\/shop/);await expect(page.locator('header')).toHaveCount(1);}
 await page.goto('/shop?category=Women');await expect(page.getByLabel('Category',{exact:true})).toHaveValue('Women');
 await page.setViewportSize({width:375,height:850});await page.getByRole('button',{name:'Open menu'}).click();await expect(page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Shop',exact:true})).toHaveCount(1);
});
test('RP211 blank optional discount and inline invalid input never submit an order',async({page})=>{
 await page.goto('/shop/products/RP-T01');await page.getByRole('button',{name:'Add to cart',exact:true}).click();await page.goto('/shop/checkout');await page.getByRole('button',{name:'Create an account',exact:true}).click();await page.getByLabel('Name',{exact:true}).fill('Discount Customer');await page.getByLabel('Email',{exact:true}).fill(`discount-${crypto.randomUUID()}@example.invalid`);await page.getByLabel('Password (12 characters minimum)').fill('Discount-test-password123');await page.getByRole('button',{name:'Register',exact:true}).click();
 await page.getByLabel('Recipient name').fill('Discount Customer');await page.getByLabel('Phone',{exact:true}).fill('0821234567');await page.getByLabel('Street address').fill('1 Test Street');await page.getByLabel('City',{exact:true}).fill('Johannesburg');await page.getByLabel('Postal code').fill('2000');await page.getByLabel('Province').selectOption('Gauteng');
 const discount=page.getByLabel('Discount code (optional)',{exact:true});await discount.fill('   ');await page.getByRole('button',{name:'Review order',exact:true}).click();await expect(page.getByRole('heading',{name:'Review your order'})).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);
 await discount.fill('INVALID-CODE');await page.getByRole('button',{name:'Review order',exact:true}).click();await expect(page.locator('#discount-feedback')).toContainText('invalid or expired');await expect(discount).toHaveAttribute('aria-invalid','true');await expect(page.getByRole('button',{name:'Place pending order'})).toHaveCount(0);
 expect(await page.evaluate(async()=>{const r=await fetch('/api/commerce/orders');return(await r.json()).orders.length})).toBe(0);
 await discount.fill('test10');await page.getByRole('button',{name:'Review order',exact:true}).click();await expect(page.getByText('Discount −R 35.00',{exact:true})).toBeVisible();
});
