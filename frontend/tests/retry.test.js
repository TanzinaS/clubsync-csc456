import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/services/api.js';
import { isRetryable, RETRY_DELAYS_MS, withRetry } from '../src/services/retry.js';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('isRetryable', () => {
  it('retries network errors, timeouts, and 5xx responses', () => {
    expect(isRetryable(new ApiError('Network request failed'))).toBe(true);
    expect(isRetryable(new ApiError('Request timed out'))).toBe(true);
    expect(isRetryable(new ApiError('Data unavailable', 500))).toBe(true);
    expect(isRetryable(new ApiError('Bad gateway', 502))).toBe(true);
  });

  it('does not retry 4xx responses or bad data', () => {
    expect(isRetryable(new ApiError('Not found', 404))).toBe(false);
    expect(isRetryable(new Error('The API returned an unexpected directory format.'))).toBe(false);
  });
});

describe('withRetry', () => {
  it('returns the first successful result without waiting', async () => {
    const task = vi.fn(async () => 'ok');
    await expect(withRetry(task)).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('backs off 1s, 2s, then 4s between attempts', async () => {
    const task = vi.fn()
      .mockRejectedValueOnce(new ApiError('Network request failed'))
      .mockRejectedValueOnce(new ApiError('Network request failed'))
      .mockRejectedValueOnce(new ApiError('Data unavailable', 500))
      .mockResolvedValueOnce('ok');
    const onRetry = vi.fn();
    const result = withRetry(task, { onRetry });

    await vi.advanceTimersByTimeAsync(0);
    expect(task).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(task).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(task).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2000);
    expect(task).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(4000);

    await expect(result).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(4);
    expect(onRetry.mock.calls.map(([info]) => [info.retry, info.of, info.delay])).toEqual([[1, 3, 1000], [2, 3, 2000], [3, 3, 4000]]);
  });

  it('gives up with the last error after every retry fails', async () => {
    const error = new ApiError('Network request failed');
    const task = vi.fn(async () => { throw error; });
    const result = withRetry(task);
    result.catch(() => {});

    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS.reduce((a, b) => a + b));
    await expect(result).rejects.toBe(error);
    expect(task).toHaveBeenCalledTimes(RETRY_DELAYS_MS.length + 1);
  });

  it('fails right away on an error that would not change on retry', async () => {
    const error = new ApiError('Not found', 404);
    const task = vi.fn(async () => { throw error; });

    await expect(withRetry(task)).rejects.toBe(error);
    expect(task).toHaveBeenCalledTimes(1);
  });
});
