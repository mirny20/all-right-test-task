import { test as base, expect } from '@playwright/test';
import { CartPage } from '@src/pages/CartPage';
import { CheckoutCompletePage } from '@src/pages/CheckoutCompletePage';
import { CheckoutInfoPage } from '@src/pages/CheckoutInfoPage';
import { CheckoutOverviewPage } from '@src/pages/CheckoutOverviewPage';
import { InventoryPage } from '@src/pages/InventoryPage';
import { LoginPage } from '@src/pages/LoginPage';

interface UiFixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInfoPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
}

/** Logged in as standard_user (storageState from `auth.setup.ts`, via the `ui` project). */
export const test = base.extend<UiFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutInfoPage: async ({ page }, use) => {
    await use(new CheckoutInfoPage(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page));
  },
  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },
});

/** Same page objects, but no session: for login and access-control tests. */
export const guestTest = test.extend({
  storageState: { cookies: [], origins: [] },
});

export { expect };
