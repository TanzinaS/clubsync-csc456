/**
 * @vitest-environment jsdom
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// The directory loads fine, but GET /api/me fails on every attempt. Calls are logged here
// because Vitest clears mock call counts between tests.
const meCalls = [];
vi.mock('../src/services/api.js', async importOriginal => {
  const real = await importOriginal();
  const clubs = (await import('../../data/sample_clubs.json')).default;
  const events = (await import('../../data/sample_events.json')).default;
  return {
    ...real,
    getClubs: vi.fn(async () => clubs),
    getEvents: vi.fn(async () => events),
    getMe: vi.fn(() => { meCalls.push(Date.now() - start); return Promise.reject(new real.ApiError('Data unavailable', 500)); }),
  };
});

const main = () => document.querySelector('#main');
let api;
let start;

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  vi.setSystemTime(new Date('2026-11-16T09:00:00-05:00'));
  start = Date.now();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  document.body.innerHTML = '<header id="header"></header><main id="main" tabindex="-1"></main><dialog id="event-dialog"></dialog>';
  HTMLDialogElement.prototype.close = vi.fn();
  window.scrollTo = vi.fn();
  window.location.hash = '#/clubs';
  api = await import('../src/services/api.js');
  await import('../src/main.js');
});

afterAll(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('startup when follows fail to load', () => {
  it('renders the clubs right away without waiting for follows', async () => {
    await vi.waitFor(() => expect(main().querySelectorAll('.club-card').length).toBeGreaterThan(0));
    expect(main().querySelector('[role="alert"]')).toBeNull();
    expect(main().querySelector('[data-retry-load]')).toBeNull();
  });

  it('shows every club as not followed', () => {
    const buttons = main().querySelectorAll('[data-follow]');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach(button => {
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.textContent).toBe('Follow');
    });
  });

  it('retries follows quietly, then logs the error and leaves the page alone', async () => {
    await vi.advanceTimersByTimeAsync(8000);
    expect(meCalls).toEqual([0, 1000, 3000, 7000]);
    expect(console.error).toHaveBeenCalledWith('Could not load followed clubs. Showing every club as not followed.', expect.any(api.ApiError));
    expect(console.error).not.toHaveBeenCalledWith('Could not load clubs and events from the API.', expect.anything());
    expect(main().querySelectorAll('.club-card').length).toBeGreaterThan(0);
  });

  it('still renders events', async () => {
    window.location.hash = '#/events';
    await vi.waitFor(() => expect(main().querySelector('h1').textContent).toBe('Campus events'));
    expect(main().querySelectorAll('#events-results .event-card').length).toBeGreaterThan(0);
  });
});
