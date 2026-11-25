import type { APIResponse } from '@playwright/test';
import { test, expect } from '@src/fixtures/api.fixture';
import type { BookingClient } from '@src/api/BookingClient';
import type { Booking, CreateBookingResponse } from '@src/api/types';
import { env } from '@src/config/env';
import { buildBooking } from '@src/data/booking.factory';

const NON_EXISTENT_ID = 999_999_999;

/**
 * For known-bug cases where the API wrongly accepts an invalid booking (200):
 * delete it before asserting, so the shared instance is not polluted when the
 * (correct) assertion fails under `test.fail()`.
 */
async function deleteIfCreated(
  client: BookingClient,
  token: string,
  response: APIResponse,
): Promise<void> {
  if (response.status() !== 200) return;
  const body = (await response.json()) as CreateBookingResponse;
  await client.deleteBooking(body.bookingid, token);
}

test.describe('booking API negative cases', { tag: ['@api', '@negative'] }, () => {
  test('should reject update without a token with 403', async ({
    bookingClient,
    createdBooking,
  }) => {
    const response = await bookingClient.updateBooking(
      createdBooking.bookingid,
      buildBooking({ lastname: 'Hacked' }),
    );
    expect(response.status()).toBe(403);
    expect(await response.text()).toBe('Forbidden');

    const after = await bookingClient.getBooking(createdBooking.bookingid);
    expect(after.status()).toBe(200);
    expect((await after.json()) as Booking).toEqual(createdBooking.booking);
  });

  test('should return 404 for a non-existent booking id', async ({ bookingClient }) => {
    const response = await bookingClient.getBooking(NON_EXISTENT_ID);
    expect(response.status()).toBe(404);
    expect(await response.text()).toBe('Not Found');
  });

  test(
    'should reject auth with a wrong password with 401',
    {
      annotation: {
        type: 'bug',
        description:
          'BUG-01: POST /auth with bad credentials returns 200 + {"reason":"Bad credentials"}',
      },
    },
    async ({ bookingClient }) => {
      test.fail();
      const response = await bookingClient.auth({
        username: env.booker.username,
        password: 'wrong-password',
      });
      expect(response.status()).toBe(401);
    },
  );

  test(
    'should reject a booking without firstname with 400',
    {
      annotation: {
        type: 'bug',
        description: 'BUG-02: POST /booking with a missing required field returns 500',
      },
    },
    async ({ bookingClient, token }) => {
      test.fail();
      const withoutFirstname: Partial<Booking> = buildBooking();
      delete withoutFirstname.firstname;
      const response = await bookingClient.createBookingRaw(withoutFirstname);
      await deleteIfCreated(bookingClient, token, response);
      expect(response.status()).toBe(400);
    },
  );

  test(
    'should reject a booking with a string totalprice with 400',
    {
      annotation: {
        type: 'bug',
        description: 'BUG-03: POST /booking accepts totalprice "abc" (200) and stores null',
      },
    },
    async ({ bookingClient, token }) => {
      test.fail();
      const response = await bookingClient.createBookingRaw({
        ...buildBooking(),
        totalprice: 'abc',
      });
      await deleteIfCreated(bookingClient, token, response);
      expect(response.status()).toBe(400);
    },
  );

  test(
    'should reject a booking with checkout before checkin with 400',
    {
      annotation: {
        type: 'bug',
        description: 'BUG-04: POST /booking accepts checkout earlier than checkin (200)',
      },
    },
    async ({ bookingClient, token }) => {
      test.fail();
      const response = await bookingClient.createBooking(
        buildBooking({ bookingdates: { checkin: '2030-01-10', checkout: '2030-01-05' } }),
      );
      await deleteIfCreated(bookingClient, token, response);
      expect(response.status()).toBe(400);
    },
  );

  test(
    'should return 404 when deleting an already deleted booking',
    {
      annotation: {
        type: 'bug',
        description: 'BUG-05: DELETE on an already deleted booking returns 405 Method Not Allowed',
      },
    },
    async ({ bookingClient, token, createdBooking }) => {
      test.fail();
      const first = await bookingClient.deleteBooking(createdBooking.bookingid, token);
      expect(first.status()).toBe(201);

      const second = await bookingClient.deleteBooking(createdBooking.bookingid, token);
      expect(second.status()).toBe(404);
    },
  );
});
