import { test, expect } from '@src/fixtures/ui.fixture';
import { buildCustomer } from '@src/data/customer.factory';
import { checkoutErrors } from '@src/data/messages';
import { formatPrice, orderTotals, products } from '@src/data/products';

const { backpack, bikeLight } = products;

test.describe('checkout', { tag: '@ui' }, () => {
  test(
    'should complete checkout with correct overview totals',
    { tag: '@smoke' },
    async ({
      inventoryPage,
      cartPage,
      checkoutInfoPage,
      checkoutOverviewPage,
      checkoutCompletePage,
    }) => {
      const order = [backpack, bikeLight];
      const totals = orderTotals(order);

      await test.step('add items and open the cart', async () => {
        await inventoryPage.goto();
        await inventoryPage.waitForLoaded();
        await inventoryPage.addToCart(...order.map((p) => p.name));
        await inventoryPage.header.openCart();
        await cartPage.waitForLoaded();
        await expect(cartPage.cartItems.names).toHaveText(order.map((p) => p.name));
      });

      await test.step('enter customer information', async () => {
        await cartPage.checkout();
        await checkoutInfoPage.waitForLoaded();
        await checkoutInfoPage.submitInfo(buildCustomer());
      });

      await test.step('overview shows items, subtotal, 8% tax and total', async () => {
        await checkoutOverviewPage.waitForLoaded();
        await expect(checkoutOverviewPage.orderItems.names).toHaveText(order.map((p) => p.name));
        for (const product of order) {
          await expect(checkoutOverviewPage.orderItems.price(product.name)).toHaveText(
            formatPrice(product.price),
          );
        }
        await expect(checkoutOverviewPage.subtotal).toHaveText(
          `Item total: ${formatPrice(totals.subtotal)}`,
        );
        await expect(checkoutOverviewPage.tax).toHaveText(`Tax: ${formatPrice(totals.tax)}`);
        await expect(checkoutOverviewPage.total).toHaveText(`Total: ${formatPrice(totals.total)}`);
      });

      await test.step('finish clears the cart', async () => {
        await checkoutOverviewPage.finish();
        await checkoutCompletePage.waitForLoaded();
        await expect(checkoutCompletePage.completeHeader).toHaveText('Thank you for your order!');
        await expect(checkoutCompletePage.header.cartBadge).toBeHidden();
      });

      await test.step('back home returns to the inventory', async () => {
        await checkoutCompletePage.backHome();
        await inventoryPage.waitForLoaded();
        await expect(inventoryPage.products.cartButton(backpack.name)).toHaveText('Add to cart');
      });
    },
  );

  test.describe('validation', { tag: '@negative' }, () => {
    test.beforeEach(async ({ inventoryPage, cartPage, checkoutInfoPage }) => {
      await inventoryPage.goto();
      await inventoryPage.waitForLoaded();
      await inventoryPage.addToCart(backpack.name);
      await inventoryPage.header.openCart();
      await cartPage.checkout();
      await checkoutInfoPage.waitForLoaded();
    });

    test('should require first name, last name and postal code in order', async ({
      checkoutInfoPage,
    }) => {
      const customer = buildCustomer();

      await test.step('empty form: first name is required', async () => {
        await checkoutInfoPage.continue();
        await expect(checkoutInfoPage.error).toHaveText(checkoutErrors.firstNameRequired);
      });

      await test.step('first name only: last name is required', async () => {
        await checkoutInfoPage.firstName.fill(customer.firstName);
        await checkoutInfoPage.continue();
        await expect(checkoutInfoPage.error).toHaveText(checkoutErrors.lastNameRequired);
      });

      await test.step('no postal code: postal code is required', async () => {
        await checkoutInfoPage.lastName.fill(customer.lastName);
        await checkoutInfoPage.continue();
        await expect(checkoutInfoPage.error).toHaveText(checkoutErrors.postalCodeRequired);
      });

      await test.step('form stays on step one', async () => {
        await checkoutInfoPage.waitForLoaded();
        await expect(checkoutInfoPage.title).toHaveText('Checkout: Your Information');
      });
    });

    test(
      'should reject a postal code with special characters',
      {
        annotation: {
          type: 'bug',
          description: 'BUG-08: postal code accepts any characters, e.g. "!!!abc"',
        },
      },
      async ({ checkoutInfoPage }) => {
        test.fail();
        await checkoutInfoPage.submitInfo(buildCustomer({ postalCode: '!!!abc' }));

        await expect(checkoutInfoPage.error).toBeVisible();
        await expect(checkoutInfoPage.title).toHaveText('Checkout: Your Information');
      },
    );
  });

  test(
    'should not allow checkout with an empty cart',
    {
      tag: '@negative',
      annotation: {
        type: 'bug',
        description: 'BUG-06: checkout can be completed with an empty cart',
      },
    },
    async ({ cartPage }) => {
      test.fail();
      await cartPage.goto();
      await cartPage.waitForLoaded();
      await expect(cartPage.cartItems.items).toHaveCount(0);

      await expect(cartPage.checkoutButton).toBeDisabled();
    },
  );
});
