
/**
 * @vitest-environment jsdom
 * Issue #115: landing-page navigation.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CATEGORIES } from '../src/services/directory.js';

// Mock API requests so the tests don't need a running backend.
vi.mock('../src/services/api.js', async importOriginal => {
  const clubs = (await import('../../data/sample_clubs.json')).default;
  const events = (await import('../../data/sample_events.json')).default;

  return {
    ...(await importOriginal()),
    getClubs: vi.fn(async () => clubs),
    getEvents: vi.fn(async () => events),
    getMe: vi.fn(async () => ({
      id: 1,
      name: 'Demo User',
      followed_clubs: []
    }))
  };
});

const main = () => document.querySelector('#main');

async function navigate(hash, title) {
  window.location.hash = hash;
  window.dispatchEvent(new Event('hashchange'));

  await vi.waitFor(() => {
    expect(document.title).toBe(`${title} · CCNY`);
  });
}

beforeAll(async () => {
  // Keep sample events upcoming regardless of test date.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-16T09:00:00-05:00'));

  document.body.innerHTML = `
    <header id="header"></header>
    <main id="main" tabindex="-1"></main>
    <dialog id="event-dialog"></dialog>
  `;

  HTMLDialogElement.prototype.close = vi.fn();
  HTMLDialogElement.prototype.showModal = vi.fn();
  window.scrollTo = vi.fn();
  window.location.hash = '#/';

  await import('../src/main.js');

  await vi.waitFor(() => {
    expect(main().textContent)
      .toContain('The City College of New York');
  });
});

beforeEach(async () => {
  await navigate('#/', 'Campus Groups');
});

afterAll(() => {
  vi.useRealTimers();
});

describe('Landing-page navigation (#115)', () => {

  it('links the main buttons to events and clubs', () => {
    const actions = [
      ...main().querySelectorAll('.hero-actions a')
    ];

    expect(actions).toHaveLength(2);

    expect(
      actions.find(link =>
        link.textContent.includes('Browse events')
      )?.getAttribute('href')
    ).toBe('#/events');

    expect(
      actions.find(link =>
        link.textContent.includes('Find your club')
      )?.getAttribute('href')
    ).toBe('#/clubs');
  });

  it('renders one correctly encoded link per category', () => {
    const links = [
      ...main().querySelectorAll('.hero-categories a')
    ];

    expect(links).toHaveLength(CATEGORIES.length);

    expect(
      links.map(link => link.textContent.trim())
    ).toEqual(CATEGORIES);

    expect(
      links.map(link => link.getAttribute('href'))
    ).toEqual(
      CATEGORIES.map(category =>
        `#/events?category=${encodeURIComponent(category)}`
      )
    );
  });

  it.each(CATEGORIES)(
    'opens events with %s selected',
    async category => {
      const link = [
        ...main().querySelectorAll('.hero-categories a')
      ].find(item =>
        item.textContent.trim() === category
      );

      expect(link).toBeDefined();

      expect(link.getAttribute('href')).toBe(
        `#/events?category=${encodeURIComponent(category)}`
      );

      // Click the homepage link and follow the real router.
      link.click();
      window.dispatchEvent(new Event('hashchange'));

      await vi.waitFor(() => {
        expect(document.title)
          .toBe('Campus events · CCNY');

        expect(
          main().querySelector('#events-results')
        ).not.toBeNull();
      });

      expect(window.location.hash).toBe(
        `#/events?category=${encodeURIComponent(category)}`
      );

      const selected = [
        ...main().querySelectorAll(
          '.category-filters [data-category]'
        )
      ].filter(button =>
        button.getAttribute('aria-pressed') === 'true'
      );

      expect(selected).toHaveLength(1);
      expect(selected[0].dataset.category).toBe(category);

      expect(
        main().querySelector('#events-count')
      ).not.toBeNull();
    }
  );
});
