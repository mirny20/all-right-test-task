import type { Booking } from '@src/api/types';

/** `YYYY-MM-DD` for today + `days`. */
function isoDate(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Unique per call, so tests on the shared public instance never collide. */
export function uniqueName(prefix = 'QA'): string {
  return `${prefix}${String(Date.now())}${Math.random().toString(36).slice(2, 7)}`;
}

/** A valid booking with a unique `firstname`; override any field per test. */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: uniqueName(),
    lastname: 'Tester',
    totalprice: 150,
    depositpaid: true,
    bookingdates: { checkin: isoDate(7), checkout: isoDate(10) },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
