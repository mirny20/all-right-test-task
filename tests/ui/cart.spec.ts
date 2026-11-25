import { test, expect } from '@src/fixtures/ui.fixture';
import { products } from '@src/data/products';

const { backpack, bikeLight } = products;

test.describe('cart', { tag: '@ui' }, () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.waitForLoaded();
  });

  test('should add and remove items and keep the badge and cart in sync', async ({
    inventoryPage,
    cartPage,
  }) => {
    const { header } = inventoryPage;

    await test.step('add two items from the inventory', async () => {
      await inventoryPage.addToCart(backpack.name, bikeLight.name);
      await expect(header.cartBadge).toHaveText('2');
      await expect(inventoryPage.products.cartButton(backpack.name)).toHaveText('Remove');
      await expect(inventoryPage.products.cartButton(bikeLight.name)).toHaveText('Remove');
    });

    await test.step('cart lists both items with quantity 1', async () => {
      await header.openCart();
      await cartPage.waitForLoaded();
      await expect(cartPage.cartItems.names).toHaveText([backpack.name, bikeLight.name]);
      await expect(cartPage.cartItems.quantity(backpack.name)).toHaveText('1');
      await expect(cartPage.cartItems.quantity(bikeLight.name)).toHaveText('1');
    });

    await test.step('remove one item in the cart', async () => {
      await cartPage.removeItem(backpack.name);
      await expect(cartPage.cartItems.names).toHaveText([bikeLight.name]);
      await expect(header.cartBadge).toHaveText('1');
    });

    await test.step('inventory reflects the cart after continue shopping', async () => {
      await cartPage.continueShopping();
      await inventoryPage.waitForLoaded();
      await expect(inventoryPage.products.cartButton(backpack.name)).toHaveText('Add to cart');
      await expect(inventoryPage.products.cartButton(bikeLight.name)).toHaveText('Remove');
    });

    await test.step('remove the last item from the inventory', async () => {
      await inventoryPage.removeFromCart(bikeLight.name);
      await expect(header.cartBadge).toBeHidden();
      await expect(inventoryPage.products.cartButton(bikeLight.name)).toHaveText('Add to cart');
    });
  });

  test(
    'should reset item buttons to "Add to cart" after Reset App State',
    {
      tag: '@negative',
      annotation: {
        type: 'bug',
        description:
          'BUG-07: after Reset App State the cart is cleared, but item buttons still say "Remove"',
      },
    },
    async ({ inventoryPage }) => {
      test.fail();
      await inventoryPage.addToCart(backpack.name, bikeLight.name);
      await expect(inventoryPage.header.cartBadge).toHaveText('2');

      await inventoryPage.menu.resetAppState();

      await expect(inventoryPage.header.cartBadge).toBeHidden();
      await expect(inventoryPage.products.cartButton(backpack.name)).toHaveText('Add to cart');
      await expect(inventoryPage.products.cartButton(bikeLight.name)).toHaveText('Add to cart');
    },
  );
});
