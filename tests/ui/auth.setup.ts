import { test as setup, expect } from '@playwright/test';
import { env } from '@src/config/env';
import { STORAGE_STATE } from '../../playwright.config';

// Temporary inline login; replaced by LoginPage in Phase 3.1.
setup('authenticate as standard_user', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('username').fill(env.sauce.username);
  await page.getByTestId('password').fill(env.sauce.password);
  await page.getByTestId('login-button').click();
  await expect(page.getByTestId('inventory-list')).toBeVisible();
  await page.context().storageState({ path: STORAGE_STATE });
});
