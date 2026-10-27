import {test,expect} from '@playwright/test';

test('size and quantity survive refresh, contact request downloads when clipboard is unavailable',async({page})=>{
 await page.goto('/#catalogue');
 await page.getByLabel("Size for Women's Black Statement",{exact:true}).selectOption('XL');
 await page.getByRole('button',{name:'Enquiry',exact:true}).first().click();
 await page.getByRole('button',{name:'Increase quantity'}).click();
 await page.keyboard.press('Escape');
 await page.locator('input[name="name"]').fill('Software QA');
 await page.locator('input[name="email"]').fill('qa@example.com');
 await page.locator('textarea[name="note"]').fill('Please confirm this look and sizing.');
 await page.reload();
 await page.getByRole('button',{name:/Open enquiry bag/}).click();
 await expect(page.getByRole('dialog')).toContainText('Size XL');
 await expect(page.getByRole('dialog').locator('.quantity b')).toHaveText('2');
 await page.keyboard.press('Escape');
 await expect(page.locator('textarea[name="note"]')).toHaveValue('Please confirm this look and sizing.');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Clipboard unavailable')}},configurable:true}));
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'COPY ENQUIRY BRIEF',exact:true}).click()]);
 const stream=await download.createReadStream();let text='';for await(const chunk of stream)text+=chunk.toString();
 expect(text).toContain("2 × Women's Black Statement / XL");
 expect(text).toContain('Please confirm this look and sizing.');
 await expect(page.getByRole('status')).toContainText('download started');
});

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
 await page.getByRole('button',{name:/Open enquiry bag/}).click();
 await expect(page.getByRole('button',{name:'Close enquiry bag'})).toBeFocused();
 await page.keyboard.press('Shift+Tab');
 expect(await page.getByRole('dialog').evaluate(e=>e.contains(document.activeElement))).toBe(true);
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 expect(errors).toEqual([]);
});
