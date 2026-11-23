/**
 * @vitest-environment jsdom
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// A small stand-in for the Flask demo user. The user already follows club 6,
// which is what GET /api/me would return after a page refresh.
const backend = vi.hoisted(() => ({ followed: [6], fail: false, hold: null }));

vi.mock('../src/services/api.js', async importOriginal => {
  const real = await importOriginal();
  const clubs = (await import('../../data/sample_clubs.json')).default;
  const events = (await import('../../data/sample_events.json')).default;
  const user = () => ({ id: 1, name: 'Demo User', followed_clubs: [...backend.followed] });
  const respond = async change => {
    if (backend.hold) await backend.hold;
    if (backend.fail) throw new real.ApiError('Network request failed');
    change();
    return user();
  };
  return {
    ...real,
    getClubs: vi.fn(async () => clubs),
    getEvents: vi.fn(async () => events),
    getMe: vi.fn(async () => user()),
    followClub: vi.fn(id => respond(() => { if (!backend.followed.includes(id)) backend.followed.push(id); })),
    unfollowClub: vi.fn(id => respond(() => { backend.followed = backend.followed.filter(clubId => clubId !== id); })),
  };
});

let api;
const button = (id, root = document.querySelector('#main')) => root.querySelector(`[data-follow="${id}"]`);
const dialog = () => document.querySelector('#event-dialog');
const goTo = async (hash, selector) => {
  window.location.hash = hash;
  await vi.waitFor(() => expect(document.querySelector(selector)).not.toBeNull());
};

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-16T09:00:00-05:00'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  document.body.innerHTML = '<header id="header"></header><main id="main" tabindex="-1"></main><dialog id="event-dialog"></dialog>';
  HTMLDialogElement.prototype.close = vi.fn();
  HTMLDialogElement.prototype.showModal = vi.fn();
  window.scrollTo = vi.fn();
  window.location.hash = '#/clubs';
  api = await import('../src/services/api.js');
  await import('../src/main.js');
  await vi.waitFor(() => expect(document.querySelectorAll('.club-card')).toHaveLength(14));
});

afterAll(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('follow controls in the club directory', () => {
  it('shows a Follow button on every club, with follows restored from GET /api/me', () => {
    expect(document.querySelectorAll('.club-card [data-follow]')).toHaveLength(14);
    // Only GET /api/me knows about club 6, so this state came from it.
    expect(button(6).getAttribute('aria-pressed')).toBe('true');
    expect(button(6).textContent).toBe('Following');
    expect(button(1).getAttribute('aria-pressed')).toBe('false');
    expect(button(1).textContent).toBe('Follow');
    expect(button(1).getAttribute('aria-label')).toMatch(/^Follow /);
  });

  it('disables the button while the request runs, then shows Following', async () => {
    let release;
    backend.hold = new Promise(resolve => { release = resolve; });
    button(1).focus();
    button(1).click();

    expect(button(1).getAttribute('aria-disabled')).toBe('true');
    button(1).click();
    expect(api.followClub).toHaveBeenCalledTimes(1);

    backend.hold = null;
    release();
    await vi.waitFor(() => expect(button(1).getAttribute('aria-pressed')).toBe('true'));
    expect(button(1).hasAttribute('aria-disabled')).toBe(false);
    expect(button(1).textContent).toBe('Following');
    expect(document.activeElement).toBe(button(1));
    expect(api.followClub).toHaveBeenCalledWith(1);
  });

  it('unfollows on a second click', async () => {
    button(1).click();
    await vi.waitFor(() => expect(button(1).getAttribute('aria-pressed')).toBe('false'));
    expect(api.unfollowClub).toHaveBeenCalledWith(1);
    expect(backend.followed).toEqual([6]);
  });

  it('keeps the previous state and shows the error next to the button when a request fails', async () => {
    backend.fail = true;
    button(2).click();

    const error = button(2).closest('.follow-control').querySelector('.follow-error');
    await vi.waitFor(() => expect(error.textContent).toBe('Couldn’t update. Try again.'));
    expect(button(2).getAttribute('aria-pressed')).toBe('false');
    expect(button(2).hasAttribute('aria-disabled')).toBe(false);
    expect(document.querySelectorAll('.club-card')).toHaveLength(14);
    expect(button(3).closest('.follow-control').querySelector('.follow-error').textContent).toBe('');

    backend.fail = false;
    button(2).click();
    await vi.waitFor(() => expect(button(2).getAttribute('aria-pressed')).toBe('true'));
    expect(error.textContent).toBe('');
  });
});

describe('follow controls in event details', () => {
  let event;

  it('shows the shared follow state for the event’s club', async () => {
    await goTo('#/events', '#events-results .event-card');
    const events = (await import('../../data/sample_events.json')).default;
    event = events.find(item => item.club_id === 2);
    document.querySelector(`[data-event="${event.id}"]`).click();

    expect(dialog().querySelectorAll('[data-follow]')).toHaveLength(1);
    expect(button(2, dialog()).getAttribute('aria-pressed')).toBe('true');
    expect(button(2, dialog()).textContent).toBe('Following');
  });

  it('unfollowing from the dialog shows on the clubs page, and the other way round', async () => {
    button(2, dialog()).click();
    await vi.waitFor(() => expect(button(2, dialog()).getAttribute('aria-pressed')).toBe('false'));

    await goTo('#/clubs', '.club-card');
    expect(button(2).getAttribute('aria-pressed')).toBe('false');
    button(2).click();
    await vi.waitFor(() => expect(button(2).getAttribute('aria-pressed')).toBe('true'));

    await goTo('#/events', '#events-results .event-card');
    document.querySelector(`[data-event="${event.id}"]`).click();
    expect(button(2, dialog()).getAttribute('aria-pressed')).toBe('true');
    expect(backend.followed.sort()).toEqual([2, 6]);
  });
});
