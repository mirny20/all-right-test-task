// Shapes verified against the live restful-booker API on 2026-11-25 (see PLAN.md "API findings").
// Error responses are text/plain (e.g. "Forbidden"), so they have no type here.

export interface BookingDates {
  /** ISO date, `YYYY-MM-DD`. */
  checkin: string;
  /** ISO date, `YYYY-MM-DD`. */
  checkout: string;
}

/** Body of `GET /booking/{id}` and payload of `POST`/`PUT /booking`. */
export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
}

/** `POST /booking` -> 200. */
export interface CreateBookingResponse {
  bookingid: number;
  booking: Booking;
}

/** Item of `GET /booking[?filters]` -> 200. */
export interface BookingIdItem {
  bookingid: number;
}

export interface Credentials {
  username: string;
  password: string;
}

/** `POST /auth` with valid credentials -> 200. */
export interface AuthSuccess {
  token: string;
}

/** `POST /auth` with invalid credentials -> 200 as well (BUG-01). */
export interface AuthFailure {
  reason: string;
}

export type AuthResponse = AuthSuccess | AuthFailure;

export function isAuthSuccess(body: AuthResponse): body is AuthSuccess {
  return 'token' in body;
}

export interface BookingFilter {
  firstname?: string;
  lastname?: string;
  checkin?: string;
  checkout?: string;
}
