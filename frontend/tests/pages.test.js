
/**
 * @vitest-environment jsdom
 */

import {
  beforeAll,
  describe,
  expect,
  it,
  vi
} from 'vitest';

beforeAll(async () => {
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
});

function navigate(route) {
  window.location.hash = route;
  window.dispatchEvent(new Event('hashchange'));
}

describe('ClubSync Router', () => {
  it.each([
    ['#/', 'The City College of New York'],
    ['#/events', 'Campus events'],
    ['#/clubs', 'A place for every interest'],
    ['#/calendar', 'This week at CCNY'],
    ['#/signin', 'Sign in'],
    ['#/signup', 'Create account']
  ])('renders %s correctly', (route, expected) => {
    navigate(route);

    expect(document.querySelector('#main').textContent)
      .toContain(expected);
  });

  it('shows a fallback for unknown routes', () => {
    navigate('#/does-not-exist');

    expect(document.querySelector('#main').textContent)
      .toContain('This path is a little quiet');
  });
});

describe('Events Page', () => {
  it('shows the events search input', () => {
    navigate('#/events');

    expect(document.querySelector('#event-search'))
      .not.toBeNull();
  });

  it('shows an empty state when no events match', () => {
    navigate('#/events');

    const search = document.querySelector('#event-search');
    search.value = 'xyznonexistent123';
    search.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelector('#events-results').textContent)
      .toContain('No events found');
  });
});

describe('Clubs Page', () => {
  it('shows the club search input', () => {
    navigate('#/clubs');

    expect(document.querySelector('#club-search'))
      .not.toBeNull();
  });

  it('filters clubs by search text', () => {
    navigate('#/clubs');

    const search = document.querySelector('#club-search');
    search.value = 'xyznonexistent123';
    search.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelector('#clubs-results').textContent)
      .toContain('No clubs found');
  });
});

describe('Additional Filter Tests', () => {
  it('filters events by category', () => {
    navigate('#/events');

    const button = document.querySelector(
      '[data-category="Tech"]'
    );

    button.click();

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(window.location.hash).toContain('category=Tech');
  });

  it('filters events by club', () => {
    navigate('#/events');

    const select = document.querySelector('#club-filter');

    select.value = '6';
    select.dispatchEvent(
      new Event('change', { bubbles: true })
    );

    expect(window.location.hash).toContain('club=6');
    expect(select.value).toBe('6');
  });

  it('filters clubs by category', () => {
    navigate('#/clubs');

    const select = document.querySelector('#club-category');

    select.value = 'Tech';
    select.dispatchEvent(
      new Event('change', { bubbles: true })
    );

    expect(select.value).toBe('Tech');
    expect(document.querySelector('#clubs-results').textContent)
      .toContain('Robotics Club');
  });
});