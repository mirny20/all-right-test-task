import { env } from '@src/config/env';

export interface User {
  username: string;
  password: string;
}

/** saucedemo users. Credentials come from env (see .env.example). */
export const users = {
  standard: { username: env.sauce.username, password: env.sauce.password },
  wrongPassword: { username: env.sauce.username, password: `${env.sauce.password}_wrong` },
} as const satisfies Record<string, User>;
