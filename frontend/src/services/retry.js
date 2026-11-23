import { ApiError } from './api.js';

// Waits before each retry: 1s, 2s, then 4s, so a cold Render server gets about a minute
// (four attempts with a 15s timeout each) before we give up.
export const RETRY_DELAYS_MS = [1000, 2000, 4000];

// Only retry failures a later attempt can fix: network errors, timeouts (status null) and 5xx.
// A 4xx or a malformed payload will fail the same way again, so it surfaces right away.
export const isRetryable = error => error instanceof ApiError && (error.status === null || error.status >= 500);

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry(task, { delays = RETRY_DELAYS_MS, shouldRetry = isRetryable, onRetry = () => {} } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (attempt >= delays.length || !shouldRetry(error)) throw error;
      onRetry({ retry: attempt + 1, of: delays.length, delay: delays[attempt], error });
      await wait(delays[attempt]);
    }
  }
}
