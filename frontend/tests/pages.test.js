
/**
 * @vitest-environment jsdom
 */

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi
} from 'vitest';

// Mock the backend API so page tests do not require Flask.
// This also supports the asynchronous loading introduced in PR #120.
vi.mock('../src/services/api.js', async importOriginal => {
  const clubs = (
    await import('../../data/sample_clubs.json')
  ).default;

  const events = (
    await import('../../data/sample_events.json')
  ).default;

  return {
    ...(await importOriginal()),
    getClubs: vi.fn(async () => clubs),
    getEvents: vi.fn(async () => events)
  };
});

const main = () => document.querySelector('#main');

const eventResults = () =>
  document.querySelector('#events-results').textContent;

const clubResults = () =>
  document.querySelector('#clubs-results').textContent;

const routeTitles = {
  '#/': 'Campus Groups',
  '#/events': 'Campus events',
  '#/clubs': 'Campus clubs',
  '#/calendar': 'This week at CCNY',
  '#/signin': 'Sign in',
  '#/signup': 'Sign up'
};

beforeAll(async () => {
  // Keep the sample events upcoming regardless of
  // the actual day when the tests are executed.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(
    new Date('2026-11-16T09:00:00-05:00')
  );

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

  // Wait for initial API loading and page rendering.
  await vi.waitFor(() => {
    expect(main().textContent)
      .toContain('The City College of New York');
  });
});

afterAll(() => {
  vi.useRealTimers();
});

// Navigate through the real hash router and wait
// until the requested page has rendered.
async function navigate(route) {
  window.location.hash = route;
  window.dispatchEvent(new Event('hashchange'));

  const path = route.split('?')[0];
  const title = routeTitles[path] || 'Page not found';

  await vi.waitFor(() => {
    expect(document.title).toBe(`${title} · CCNY`);
  });
}

describe('ClubSync Router', () => {
  it.each([
    ['#/', 'The City College of New York'],
    ['#/events', 'Campus events'],
    ['#/clubs', 'A place for every interest'],
    ['#/calendar', 'This week at CCNY'],
    ['#/signin', 'Sign in to your account'],
    ['#/signup', 'Create account']
  ])('renders %s correctly', async (route, expected) => {
    await navigate(route);

    expect(main().textContent).toContain(expected);
  });

  it('shows a fallback for unknown routes', async () => {
    await navigate('#/does-not-exist');

    expect(main().textContent)
      .toContain('This path is a little quiet');
  });
});

describe('Events Page', () => {
  it('shows the events search input', async () => {
    await navigate('#/events');

    expect(document.querySelector('#event-search'))
      .not.toBeNull();
  });

  it('finds an event using search text', async () => {
    await navigate('#/events');

    const search = document.querySelector('#event-search');

    search.value = 'Line-Following Bots';
    search.dispatchEvent(
      new Event('input', { bubbles: true })
    );

    expect(eventResults())
      .toContain('Build Night: Line-Following Bots');

    expect(eventResults())
      .not.toContain('Bachata Workshop for Beginners');

    expect(document.querySelector('#events-count').textContent)
      .toBe('1 upcoming event');
  });

  it('shows an empty state when nothing matches', async () => {
    await navigate('#/events');

    const search = document.querySelector('#event-search');

    search.value = 'xyznonexistent123';
    search.dispatchEvent(
      new Event('input', { bubbles: true })
    );

    expect(eventResults())
      .toContain('No events found');

    expect(eventResults())
      .not.toContain('Build Night: Line-Following Bots');
  });

  it('filters events by category', async () => {
    await navigate('#/events');

    const button = document.querySelector(
      '[data-category="Tech"]'
    );

    button.click();

    expect(button.getAttribute('aria-pressed'))
      .toBe('true');

    expect(window.location.hash)
      .toContain('category=Tech');

    // Verify the displayed results, not just the button.
    expect(eventResults())
      .toContain('Build Night: Line-Following Bots');

    expect(eventResults())
      .not.toContain('Bachata Workshop for Beginners');
  });

  it('filters events by club', async () => {
    await navigate('#/events');

    const select = document.querySelector('#club-filter');

    select.value = '6';
    select.dispatchEvent(
      new Event('change', { bubbles: true })
    );

    expect(window.location.hash)
      .toContain('club=6');

    expect(document.querySelector('#events-count').textContent)
      .toBe('1 upcoming event');

    expect(eventResults())
      .toContain('Build Night: Line-Following Bots');

    expect(eventResults())
      .not.toContain('Bachata Workshop for Beginners');
  });

  it('loads bookmarked event filters from the URL', async () => {
    await navigate('#/events?category=Tech&club=6');

    expect(document.querySelector('#club-filter').value)
      .toBe('6');

    expect(document.querySelector(
      '[data-category="Tech"]'
    ).getAttribute('aria-pressed')).toBe('true');

    expect(eventResults())
      .toContain('Build Night: Line-Following Bots');

    expect(eventResults())
      .not.toContain('Bachata Workshop for Beginners');
  });
});

describe('Clubs Page', () => {
  it('shows the club search input', async () => {
    await navigate('#/clubs');

    expect(document.querySelector('#club-search'))
      .not.toBeNull();
  });

  it('finds clubs using search text', async () => {
    await navigate('#/clubs');

    const search = document.querySelector('#club-search');

    search.value = 'Robotics';
    search.dispatchEvent(
      new Event('input', { bubbles: true })
    );

    expect(clubResults())
      .toContain('Robotics Club');

    expect(clubResults())
      .not.toContain('Math Wizards');

    expect(document.querySelector('#clubs-count').textContent)
      .toBe('1 club to discover');
  });

  it('shows an empty state when no clubs match', async () => {
    await navigate('#/clubs');

    const search = document.querySelector('#club-search');

    search.value = 'xyznonexistent123';
    search.dispatchEvent(
      new Event('input', { bubbles: true })
    );

    expect(clubResults())
      .toContain('No clubs found');

    expect(clubResults())
      .not.toContain('Robotics Club');
  });

  it('filters clubs by category', async () => {
    await navigate('#/clubs');

    const select = document.querySelector('#club-category');

    select.value = 'Tech';
    select.dispatchEvent(
      new Event('change', { bubbles: true })
    );

    expect(select.value).toBe('Tech');

    // Verify which clubs are actually displayed.
    expect(clubResults())
      .toContain('Robotics Club');

    expect(clubResults())
      .not.toContain('Math Wizards');
  });

  it('clears club filters and restores the directory', async () => {
    await navigate('#/clubs');

    const search = document.querySelector('#club-search');

    search.value = 'xyznonexistent123';
    search.dispatchEvent(
      new Event('input', { bubbles: true })
    );

    expect(clubResults()).toContain('No clubs found');

    document.querySelector('[data-clear-clubs]').click();

    expect(clubResults()).toContain('Robotics Club');
    expect(clubResults()).toContain('Math Wizards');
  });
});
