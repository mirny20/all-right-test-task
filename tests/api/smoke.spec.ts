import { test, expect } from '@src/fixtures/api.fixture';

// Verified with curl on 2026-11-25: GET /ping returns 201 Created (not 200).
test('should respond to health check', { tag: ['@smoke', '@api'] }, async ({ bookingClient }) => {
  const response = await bookingClient.ping();
  expect(response.status()).toBe(201);
});
