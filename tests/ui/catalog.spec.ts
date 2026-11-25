import { test, expect } from '@src/fixtures/ui.fixture';
import { allProducts, formatPrice, sortLabels, type Product } from '@src/data/products';

const byName = (a: Product, b: Product): number => a.name.localeCompare(b.name);
const byPrice = (a: Product, b: Product): number => a.price - b.price;

/** Prices are compared as formatted text, so the $15.99 tie cannot make the order ambiguous. */
const pricesOf = (items: readonly Product[]): string[] =>
  items.map((item) => formatPrice(item.price));

test.describe('catalog', { tag: '@ui' }, () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.waitForLoaded();
  });

  test('should list all products with their prices', async ({ inventoryPage }) => {
    await expect(inventoryPage.products.items).toHaveCount(allProducts.length);
    for (const product of allProducts) {
      await expect(inventoryPage.products.price(product.name)).toHaveText(
        formatPrice(product.price),
      );
    }
  });

  test('should sort products by name and by price', async ({ inventoryPage }) => {
    const { products } = inventoryPage;

    await test.step('default is name A to Z', async () => {
      await expect(inventoryPage.activeSort).toHaveText(sortLabels.az);
      await expect(products.names).toHaveText([...allProducts].sort(byName).map((p) => p.name));
    });

    await test.step('name Z to A', async () => {
      await inventoryPage.sortBy('za');
      await expect(inventoryPage.activeSort).toHaveText(sortLabels.za);
      await expect(products.names).toHaveText(
        [...allProducts]
          .sort(byName)
          .reverse()
          .map((p) => p.name),
      );
    });

    await test.step('price low to high', async () => {
      await inventoryPage.sortBy('lohi');
      await expect(inventoryPage.activeSort).toHaveText(sortLabels.lohi);
      await expect(products.prices).toHaveText(pricesOf([...allProducts].sort(byPrice)));
    });

    await test.step('price high to low', async () => {
      await inventoryPage.sortBy('hilo');
      await expect(inventoryPage.activeSort).toHaveText(sortLabels.hilo);
      await expect(products.prices).toHaveText(pricesOf([...allProducts].sort(byPrice).reverse()));
    });

    await test.step('back to name A to Z', async () => {
      await inventoryPage.sortBy('az');
      await expect(inventoryPage.activeSort).toHaveText(sortLabels.az);
      await expect(products.names).toHaveText([...allProducts].sort(byName).map((p) => p.name));
    });
  });
});
