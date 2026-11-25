import { test, expect } from '@playwright/test';

// Verified with curl on 2026-11-25: GET /ping returns 201 Created (not 200).
test('should respond to health check', { tag: ['@smoke', '@api'] }, async ({ request }) => {
  const response = await request.get('/ping');
  expect(response.status()).toBe(201);
});
