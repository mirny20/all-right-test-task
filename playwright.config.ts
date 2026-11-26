import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

export const STORAGE_STATE = '.auth/standard_user.json';

/**
 * Specs written by the bonus generator (bonus/generate.ts). Opt-in with BONUS=1, so
 * `npx playwright test` and CI run only the real suite.
 */
const bonusProject = {
  name: 'bonus',
  testDir: './bonus/generated',
  testMatch: /.*\.spec\.ts/,
  dependencies: ['setup'],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: env.sauce.baseURL,
    storageState: STORAGE_STATE,
  },
};

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { baseURL: env.sauce.baseURL },
    },
    {
      name: 'api',
      testDir: './tests/api',
      // Public shared Heroku instance: slow and occasionally cold-starting.
      timeout: 60_000,
      use: {
        baseURL: env.booker.baseURL,
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: env.sauce.baseURL,
        storageState: STORAGE_STATE,
      },
    },
    ...(process.env.BONUS ? [bonusProject] : []),
  ],
});
