import { test, expect } from '@src/fixtures/ui.fixture';

test(
  'should open inventory with a saved session',
  { tag: ['@smoke', '@ui'] },
  async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.inventoryList).toBeVisible();
  },
);
