import { test as setup, expect } from '@src/fixtures/ui.fixture';
import { users } from '@src/data/users';
import { STORAGE_STATE } from '../../playwright.config';

// Saved right after login, so the stored localStorage has an empty cart.
setup('authenticate as standard_user', async ({ page, loginPage, inventoryPage }) => {
  await loginPage.goto();
  await loginPage.login(users.standard);
  await expect(inventoryPage.title).toHaveText('Products');
  await page.context().storageState({ path: STORAGE_STATE });
});
