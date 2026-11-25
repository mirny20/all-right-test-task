import 'dotenv/config';

/**
 * Reads a required env var. Credentials are never hardcoded: locally they come from `.env`
 * (copy `.env.example`), in CI from GitHub Secrets/Variables. A missing value fails fast.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing env var ${name}. Locally: copy .env.example to .env. In CI: set it as a GitHub Secret/Variable.`,
    );
  }
  return value;
}

export const env = {
  sauce: {
    baseURL: 'https://www.saucedemo.com',
    username: requireEnv('SAUCE_USERNAME'),
    password: requireEnv('SAUCE_PASSWORD'),
    lockedUsername: requireEnv('SAUCE_LOCKED_USERNAME'),
  },
  booker: {
    baseURL: 'https://restful-booker.herokuapp.com',
    username: requireEnv('BOOKER_USERNAME'),
    password: requireEnv('BOOKER_PASSWORD'),
  },
} as const;
