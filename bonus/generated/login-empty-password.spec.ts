import { guestTest as test, expect } from '@src/fixtures/ui.fixture';
import { loginErrors } from '@src/data/messages';
import { users } from '@src/data/users';

test.describe('login', { tag: '@ui' }, () => {
  test(
    'should show error when password is empty',
    { tag: '@negative' },
    async ({ page, loginPage }) => {
      await test.step('open login page', async () => {
        await loginPage.goto();
        await loginPage.waitForLoaded();
      });

      await test.step('enter username and leave password empty', async () => {
        await loginPage.username.fill(users.standard.username);
      });

      await test.step('click Login', async () => {
        await loginPage.loginButton.click();
      });

      await test.step('verify error is shown and user stays on login page', async () => {
        await expect(loginPage.error).toHaveText(loginErrors.passwordRequired);
        await expect(page).not.toHaveURL(/inventory\.html/);
      });
    },
  );
});
