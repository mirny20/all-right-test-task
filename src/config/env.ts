import 'dotenv/config';

/** Reads an env var, falling back to a documented public default (see .env.example). */
function envOr(name: string, fallback: string): string {
  const value = process.env[name];
  return value !== undefined && value !== '' ? value : fallback;
}

export const env = {
  sauce: {
    baseURL: 'https://www.saucedemo.com',
    username: envOr('SAUCE_USERNAME', 'standard_user'),
    password: envOr('SAUCE_PASSWORD', 'secret_sauce'),
    lockedUsername: envOr('SAUCE_LOCKED_USERNAME', 'locked_out_user'),
  },
  booker: {
    baseURL: 'https://restful-booker.herokuapp.com',
    username: envOr('BOOKER_USERNAME', 'admin'),
    password: envOr('BOOKER_PASSWORD', 'password123'),
  },
} as const;
