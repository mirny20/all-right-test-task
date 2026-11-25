import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Booking, BookingFilter, Credentials } from './types';

/**
 * Thin wrapper over restful-booker endpoints.
 * Returns raw `APIResponse` so specs assert both status and body themselves.
 * Base URL and `Accept`/`Content-Type` headers come from the `api` project config.
 * Bodies are never parsed here: error bodies are text/plain, not JSON.
 */
export class BookingClient {
  constructor(private readonly request: APIRequestContext) {}

  auth(credentials: Credentials): Promise<APIResponse> {
    return this.request.post('/auth', { data: credentials });
  }

  createBooking(booking: Booking): Promise<APIResponse> {
    return this.createBookingRaw(booking);
  }

  /** Sends any body as-is, for invalid-payload cases (missing fields, wrong types). */
  createBookingRaw(body: unknown): Promise<APIResponse> {
    return this.request.post('/booking', { data: body });
  }

  getBooking(id: number | string): Promise<APIResponse> {
    return this.request.get(`/booking/${String(id)}`);
  }

  getBookingIds(filter: BookingFilter = {}): Promise<APIResponse> {
    return this.request.get('/booking', { params: { ...filter } });
  }

  updateBooking(id: number, booking: Booking, token?: string): Promise<APIResponse> {
    return this.request.put(`/booking/${String(id)}`, {
      data: booking,
      headers: this.authHeaders(token),
    });
  }

  /** `body` is `unknown` so negative tests can send partial/invalid payloads to PUT. */
  updateBookingRaw(id: number, body: unknown, token?: string): Promise<APIResponse> {
    return this.request.put(`/booking/${String(id)}`, {
      data: body,
      headers: this.authHeaders(token),
    });
  }

  patchBooking(id: number, partial: Partial<Booking>, token?: string): Promise<APIResponse> {
    return this.request.patch(`/booking/${String(id)}`, {
      data: partial,
      headers: this.authHeaders(token),
    });
  }

  deleteBooking(id: number, token?: string): Promise<APIResponse> {
    return this.request.delete(`/booking/${String(id)}`, { headers: this.authHeaders(token) });
  }

  /** Token is optional so negative tests can omit it. Sent as a cookie, per the apidoc. */
  private authHeaders(token?: string): Record<string, string> {
    return token === undefined ? {} : { Cookie: `token=${token}` };
  }
}
