import { env } from '@src/config/env';

export interface User {
  username: string;
  password: string;
}

/** saucedemo users. Credentials are public demo values, overridable via env (see .env.example). */
export const users = {
  standard: { username: env.sauce.username, password: env.sauce.password },
  lockedOut: { username: env.sauce.lockedUsername, password: env.sauce.password },
  wrongPassword: { username: env.sauce.username, password: `${env.sauce.password}_wrong` },
  empty: { username: '', password: '' },
} as const satisfies Record<string, User>;
