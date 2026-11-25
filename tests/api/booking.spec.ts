import { test, expect } from '@src/fixtures/api.fixture';
import type { Booking, CreateBookingResponse } from '@src/api/types';
import { buildBooking } from '@src/data/booking.factory';

test(
  'should create, read, update and delete a booking',
  { tag: ['@api'] },
  async ({ bookingClient, token }) => {
    const payload = buildBooking();
    const update = buildBooking({ lastname: 'Updated', totalprice: 999, depositpaid: false });

    await test.step('auth: obtain token', () => {
      // The `token` fixture already asserted POST /auth -> 200 + {token}.
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    const id = await test.step('create booking -> 200, body echoes payload', async () => {
      const response = await bookingClient.createBooking(payload);
      expect(response.status()).toBe(200);
      const body = (await response.json()) as CreateBookingResponse;
      expect(typeof body.bookingid).toBe('number');
      expect(body.booking).toEqual(payload);
      return body.bookingid;
    });

    try {
      await test.step('get booking -> 200, matches payload', async () => {
        const response = await bookingClient.getBooking(id);
        expect(response.status()).toBe(200);
        expect((await response.json()) as Booking).toEqual(payload);
      });

      await test.step('update booking (PUT) -> 200, returns updated booking', async () => {
        const response = await bookingClient.updateBooking(id, update, token);
        expect(response.status()).toBe(200);
        expect((await response.json()) as Booking).toEqual(update);
      });

      await test.step('get booking -> 200, update persisted', async () => {
        const response = await bookingClient.getBooking(id);
        expect(response.status()).toBe(200);
        expect((await response.json()) as Booking).toEqual(update);
      });

      await test.step('delete booking -> 201 Created (as documented)', async () => {
        const response = await bookingClient.deleteBooking(id, token);
        expect(response.status()).toBe(201);
        expect(await response.text()).toBe('Created');
      });

      await test.step('get deleted booking -> 404 Not Found', async () => {
        const response = await bookingClient.getBooking(id);
        expect(response.status()).toBe(404);
        expect(await response.text()).toBe('Not Found');
      });
    } finally {
      // Best-effort cleanup if a step failed midway. After a successful flow this
      // returns 405 (BUG-05), which is expected, so the status is not asserted.
      await bookingClient.deleteBooking(id, token);
    }
  },
);
