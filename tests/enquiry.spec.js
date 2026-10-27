import {test,expect} from '@playwright/test';

test('catalogue images load on desktop/mobile and drawer traps keyboard focus',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 for(const width of [1440,375]){
  await page.setViewportSize({width,height:900});
  // Scroll every image into view so native lazy loading has real browser coverage.
  for(const img of await page.locator('img').all())await img.scrollIntoViewIfNeeded();
  await expect.poll(()=>page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`qa/commerce-regression/${process.env.BASE_URL?'hosted':'local'}-${width}.png`,fullPage:true});
 }
 await page.getByRole('button',{name:/Open Wishlist/}).click();
 await expect(page.getByRole('button',{name:'Close Wishlist'})).toBeFocused();
 await page.keyboard.press('Shift+Tab');
 expect(await page.getByRole('dialog').evaluate(e=>e.contains(document.activeElement))).toBe(true);
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 expect(errors).toEqual([]);
});
