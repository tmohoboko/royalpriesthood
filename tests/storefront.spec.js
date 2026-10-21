import { test, expect } from '@playwright/test';

test('new editorial storefront and departments render', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Wear your identity');
  for (const id of ['women', 'men', 'catalogue', 'craft', 'contact']) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
});

test('the new catalogue replaces the placeholder range', async ({ page }) => {
  await page.goto('/#catalogue');
  await expect(page.getByTestId('product-card')).toHaveCount(16);
  await expect(page.locator('body')).not.toContainText('COMING SOON');
  await expect(page.locator('body')).not.toContainText('FUTURE DROP');
});

test('department filters show category-specific looks', async ({ page }) => {
  await page.goto('/#catalogue');
  await page.getByRole('button', { name: 'Hats', exact: true }).last().click();
  await expect(page.getByTestId('product-card')).toHaveCount(7);
  await page.getByRole('button', { name: 'Pants', exact: true }).last().click();
  await expect(page.getByTestId('product-card')).toHaveCount(10);
});

test('a catalogue piece can be added to the enquiry bag', async ({ page }) => {
  await page.goto('/#catalogue');
  await page.getByRole('button', { name: 'ADD', exact: true }).first().click();
  const drawer = page.getByRole('dialog', { name: 'Enquiry bag' });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText('Women\'s Black Statement');
  await expect(drawer).toContainText('No payment');
});

test('mobile menu opens without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
});
