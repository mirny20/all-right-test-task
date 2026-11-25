import { guestTest as test, expect } from '@src/fixtures/ui.fixture';
import { loginErrors } from '@src/data/messages';
import { users } from '@src/data/users';

test.describe('login', { tag: '@ui' }, () => {
  test(
    'should log in standard_user and open the inventory',
    { tag: '@smoke' },
    async ({ page, loginPage, inventoryPage }) => {
      await loginPage.goto();
      await loginPage.login(users.standard);

      await expect(page).toHaveURL(/\/inventory\.html$/);
      await expect(inventoryPage.title).toHaveText('Products');
      await expect(inventoryPage.inventoryList).toBeVisible();
    },
  );

  test(
    'should show error when password is wrong',
    { tag: '@negative' },
    async ({ page, loginPage }) => {
      await loginPage.goto();
      await loginPage.login(users.wrongPassword);

      await expect(loginPage.error).toHaveText(loginErrors.wrongCredentials);
      await expect(page).not.toHaveURL(/inventory\.html/);
    },
  );

  test(
    'should block locked_out_user with an error',
    { tag: '@negative' },
    async ({ page, loginPage }) => {
      await loginPage.goto();
      await loginPage.login(users.lockedOut);

      await expect(loginPage.error).toHaveText(loginErrors.lockedOut);
      await expect(page).not.toHaveURL(/inventory\.html/);
    },
  );

  test(
    'should redirect to login with an error when opening the inventory without a session',
    { tag: '@negative' },
    async ({ page, loginPage, inventoryPage }) => {
      await inventoryPage.goto();

      await expect(page).toHaveURL(/\/$/);
      await expect(loginPage.loginButton).toBeVisible();
      await expect(loginPage.error).toHaveText(loginErrors.notLoggedIn('/inventory.html'));
    },
  );
});
