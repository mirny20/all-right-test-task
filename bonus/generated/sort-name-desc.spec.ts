import { test, expect } from '@src/fixtures/ui.fixture';
import { allProducts, products, sortLabels, type Product } from '@src/data/products';

const byName = (a: Product, b: Product): number => a.name.localeCompare(b.name);

test.describe('sort name Z to A', { tag: '@ui' }, () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.waitForLoaded();
  });

  test('should sort products by name Z to A and show the correct first item', async ({
    inventoryPage,
  }) => {
    await test.step('select Name (Z to A) in the sort dropdown', async () => {
      await inventoryPage.sortBy('za');
    });

    await test.step('dropdown label shows Name (Z to A)', async () => {
      await expect(inventoryPage.activeSort).toHaveText(sortLabels.za);
    });

    await test.step('products are listed in reverse alphabetical order', async () => {
      const expectedNames = [...allProducts]
        .sort(byName)
        .reverse()
        .map((p) => p.name);
      await expect(inventoryPage.products.names).toHaveText(expectedNames);
    });

    await test.step('first product is Test.allTheThings() T-Shirt (Red)', async () => {
      await expect(inventoryPage.products.names.first()).toHaveText(products.redTShirt.name);
    });
  });
});
