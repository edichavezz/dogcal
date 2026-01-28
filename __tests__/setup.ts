/**
 * Test Setup
 *
 * Global setup for Vitest tests
 */

import { beforeAll, afterAll } from 'vitest';

// Set environment variables for tests
process.env.TEST_API_BASE = process.env.TEST_API_BASE || 'http://localhost:3000';

beforeAll(() => {
  console.log('Running tests against:', process.env.TEST_API_BASE);
});

afterAll(() => {
  console.log('Tests completed');
});
