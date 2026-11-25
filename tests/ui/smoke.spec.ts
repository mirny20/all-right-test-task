import { test, expect } from '@playwright/test';

test('should open inventory with a saved session', { tag: ['@smoke', '@ui'] }, async ({ page }) => {
  await page.goto('/inventory.html');
  await expect(page.getByTestId('title')).toHaveText('Products');
  await expect(page.getByTestId('inventory-list')).toBeVisible();
});
