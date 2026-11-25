import { test as base, expect } from '@playwright/test';
import { BookingClient } from '@src/api/BookingClient';
import { isAuthSuccess, type AuthResponse, type CreateBookingResponse } from '@src/api/types';
import { env } from '@src/config/env';
import { buildBooking } from '@src/data/booking.factory';

interface ApiFixtures {
  bookingClient: BookingClient;
  /** Valid admin token from `POST /auth`. */
  token: string;
  /** A fresh booking, deleted after the test (unless the test already deleted it). */
  createdBooking: CreateBookingResponse;
}

export const test = base.extend<ApiFixtures>({
  bookingClient: async ({ request }, use) => {
    await use(new BookingClient(request));
  },

  token: async ({ bookingClient }, use) => {
    const response = await bookingClient.auth({
      username: env.booker.username,
      password: env.booker.password,
    });
    expect(response.status(), 'POST /auth status').toBe(200);
    const body = (await response.json()) as AuthResponse;
    if (!isAuthSuccess(body)) {
      throw new Error(`Auth failed in fixture: ${JSON.stringify(body)}`);
    }
    await use(body.token);
  },

  createdBooking: async ({ bookingClient, token }, use) => {
    const response = await bookingClient.createBooking(buildBooking());
    expect(response.status(), 'POST /booking status').toBe(200);
    const created = (await response.json()) as CreateBookingResponse;

    await use(created);

    // 201 = deleted now; 405 = the test already deleted it (BUG-05: should be 404).
    const cleanup = await bookingClient.deleteBooking(created.bookingid, token);
    expect([201, 405], 'cleanup DELETE status').toContain(cleanup.status());
  },
});

export { expect };
