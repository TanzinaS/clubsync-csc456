/**
 * @vitest-environment jsdom
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import indexHtml from '../index.html?raw';
import { LOADING_MESSAGE, SLOW_LOADING_MESSAGE } from '../src/components/ui.js';

// Each getClubs() call takes the next behavior from this queue, so one startup can walk
// through a slow load, every retry failing, and a manual retry that works.
const clubsCalls = [];
vi.mock('../src/services/api.js', async importOriginal => {
  const real = await importOriginal();
  const clubs = (await import('../../data/sample_clubs.json')).default;
  const events = (await import('../../data/sample_events.json')).default;
  const queue = [
    () => new Promise((_, reject) => setTimeout(() => reject(new real.ApiError('Request timed out')), 6000)),
    () => Promise.reject(new real.ApiError('Network request failed')),
    () => Promise.reject(new real.ApiError('Data unavailable', 500)),
    () => Promise.reject(new real.ApiError('Network request failed')),
    () => Promise.resolve(clubs),
  ];
  return {
    ...real,
    getClubs: vi.fn(() => { clubsCalls.push(Date.now()); return queue.shift()(); }),
    getEvents: vi.fn(async () => events),
    getMe: vi.fn(async () => ({ id: 1, name: 'Demo User', followed_clubs: [] })),
  };
});

const main = () => document.querySelector('#main');
const status = () => document.querySelector('#load-status');
const retryButton = () => document.querySelector('[data-retry-load]');
const elapsed = () => Date.now() - start;
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
  await import('../src/main.js');
});

afterAll(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('directory startup', () => {
  it('ships a loading state in index.html so the first paint is not blank', () => {
    expect(indexHtml).toContain('id="load-status" role="status" aria-live="polite"');
    expect(indexHtml).toContain(LOADING_MESSAGE);
  });

  it('shows the loading state and the nav right away', () => {
    expect(status().textContent).toBe(LOADING_MESSAGE);
    expect(status().getAttribute('role')).toBe('status');
    expect(document.querySelector('#header a[aria-current="page"]').textContent).toBe('Clubs');
  });

  it('mentions that the server may be waking up after 5 seconds', async () => {
    await vi.advanceTimersByTimeAsync(4999);
    expect(status().textContent).toBe(LOADING_MESSAGE);
    await vi.advanceTimersByTimeAsync(1);
    expect(status().textContent).toBe(SLOW_LOADING_MESSAGE);
  });

  it('retries a failed load with 1s, 2s, and 4s of backoff', async () => {
    await vi.advanceTimersByTimeAsync(1000);
    expect(status().textContent).toBe(`${SLOW_LOADING_MESSAGE} Retrying (1 of 3).`);
    await vi.advanceTimersByTimeAsync(7000);
    expect(clubsCalls.map(time => time - start)).toEqual([0, 7000, 9000, 13000]);
  });

  it('shows an error with a focused Try again button once every retry fails', () => {
    expect(elapsed()).toBe(13000);
    expect(status()).toBeNull();
    expect(main().querySelector('[role="alert"] h1').textContent).toBe('We couldn’t load clubs and events');
    expect(document.activeElement).toBe(retryButton());
    expect(main().textContent).not.toContain('0 clubs to discover');
  });

  it('keeps the nav in sync with the URL while the error is showing', async () => {
    window.location.hash = '#/events';
    await vi.waitFor(() => expect(document.querySelector('#header a[aria-current="page"]').textContent).toBe('Events'));
    expect(retryButton()).not.toBeNull();
  });

  it('loads the data and renders the current route on Try again, without a reload', async () => {
    retryButton().click();
    expect(status().textContent).toBe(LOADING_MESSAGE);
    await vi.waitFor(() => expect(main().querySelector('h1').textContent).toBe('Campus events'));
    expect(clubsCalls).toHaveLength(5);
    expect(document.querySelectorAll('#events-results .event-card').length).toBeGreaterThan(0);
  });
});
