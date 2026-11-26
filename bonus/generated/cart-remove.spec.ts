import { test, expect } from '@src/fixtures/ui.fixture';
import { products } from '@src/data/products';

const { backpack, onesie } = products;

test.describe('cart remove', { tag: '@ui' }, () => {
  test('should remove an item on the cart page and update the badge', async ({
    inventoryPage,
    cartPage,
  }) => {
    await test.step('open inventory page', async () => {
      await inventoryPage.goto();
      await inventoryPage.waitForLoaded();
    });

    await test.step('add Sauce Labs Backpack and Sauce Labs Onesie to the cart', async () => {
      await inventoryPage.addToCart(backpack.name, onesie.name);
      await expect(inventoryPage.header.cartBadge).toHaveText('2');
    });

    await test.step('open the cart', async () => {
      await inventoryPage.header.openCart();
      await cartPage.waitForLoaded();
    });

    await test.step('remove Sauce Labs Backpack from the cart', async () => {
      await cartPage.removeItem(backpack.name);
    });

    await test.step('cart lists only Sauce Labs Onesie and badge shows 1', async () => {
      await expect(cartPage.cartItems.names).toHaveText([onesie.name]);
      await expect(cartPage.header.cartBadge).toHaveText('1');
    });
  });
});
