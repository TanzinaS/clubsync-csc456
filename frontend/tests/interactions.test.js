
/**
 * @vitest-environment jsdom
 * Issue #70: Event details dialog and auth preview interactions.
 * Calendar navigation and .ics download tests follow Issue #96.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/api.js', async importOriginal => {
  const clubs = (await import('../../data/sample_clubs.json')).default;
  const events = (await import('../../data/sample_events.json')).default;
  return {
    ...(await importOriginal()),
    getClubs: vi.fn(async () => clubs),
    getEvents: vi.fn(async () => events),
    getMe: vi.fn(async () => ({ id: 1, name: 'Demo User', followed_clubs: [] }))
  };
});

const main = () => document.querySelector('#main');
const dialog = () => document.querySelector('#event-dialog');

async function navigate(hash, title) {
  window.location.hash = hash;
  window.dispatchEvent(new Event('hashchange'));
  await vi.waitFor(() => {
    expect(document.title).toBe(`${title} · CCNY`);
    expect(main().querySelector('.load-state')).toBeNull();
  });
}

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-16T09:00:00-05:00'));

  document.body.innerHTML = `
    <header id="header"></header>
    <main id="main" tabindex="-1"></main>
    <dialog id="event-dialog" aria-labelledby="dialog-title"></dialog>
  `;

  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.removeAttribute('open');
  });
  window.scrollTo = vi.fn();
  window.location.hash = '#/';

  await import('../src/main.js');
  await vi.waitFor(() => {
    expect(main().textContent).toContain('The City College of New York');
  });
});

beforeEach(() => {
  // Any authentication network request after initial page load is unexpected.
  vi.stubGlobal('fetch', vi.fn());
});

afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function openEvent() {
  const title = [...main().querySelectorAll('button[data-event]')]
    .find(button => button.textContent.includes('Build Night: Line-Following Bots'));
  expect(title).toBeDefined();
  title.click();
  expect(dialog().open).toBe(true);
  return dialog();
}

describe('Event details dialog (#70)', () => {
  beforeEach(async () => {
    await navigate('#/events', 'Campus events');
  });

  it('shows the correct title, club, date, location, and description', () => {
    const details = openEvent();
    expect(details.querySelector('#dialog-title').textContent)
      .toBe('Build Night: Line-Following Bots');
    expect(details.textContent).toContain('Robotics Club');
    expect(details.textContent).toContain('Marshak 418');
    expect(details.textContent).toContain('Build a tiny robot');
    expect(details.querySelector('[data-download="3"]')).not.toBeNull();
  });

  it('closes when the close button is clicked', () => {
    const details = openEvent();
    details.querySelector('[data-close]').click();
    expect(details.open).toBe(false);
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  it('closes when clicking outside the dialog content', () => {
    const details = openEvent();

    // jsdom has no layout, so define the dialog rectangle.
    details.getBoundingClientRect = vi.fn(() => ({
      left: 100, right: 400, top: 100, bottom: 400
    }));

    details.dispatchEvent(new MouseEvent('click', {
      bubbles: true, clientX: 20, clientY: 20
    }));

    expect(details.open).toBe(false);
  });
});

describe('Sign-in and sign-up previews (#70)', () => {
  it.each([
    ['#/signin', 'Sign in', false],
    ['#/signup', 'Sign up', true]
  ])('%s form displays a preview message without sending or saving credentials',
    async (hash, title, signup) => {
      await navigate(hash, title);

      const form = main().querySelector('#auth-form');
      expect(form).not.toBeNull();

      if (signup) {
        form.elements.namedItem('name').value = 'Test Student';
      }

      form.elements.namedItem('email').value = 'student@example.com';
      form.elements.namedItem('password').value = 'password123';

      const previousLocal = window.localStorage.length;
      const previousSession = window.sessionStorage.length;

      const submitted = form.dispatchEvent(new Event('submit', {
        bubbles: true, cancelable: true
      }));

      // The app should prevent the browser's normal form submission.
      expect(submitted).toBe(false);

      const notice = main().querySelector('#auth-message');
      expect(notice.hidden).toBe(false);
      expect(notice.textContent)
        .toContain('Your details have not been sent or saved');

      expect(window.fetch).not.toHaveBeenCalled();
      expect(window.localStorage.length).toBe(previousLocal);
      expect(window.sessionStorage.length).toBe(previousSession);

      expect(form.elements.namedItem('email').value).toBe('');
      expect(form.elements.namedItem('password').value).toBe('');
    }
  );

  it('Google sign-in shows a preview notice without contacting the API', async () => {
    await navigate('#/signin', 'Sign in');

    main().querySelector('[data-google]').click();

    const notice = main().querySelector('#auth-message');
    expect(notice.hidden).toBe(false);
    expect(notice.textContent).toContain('isn’t connected yet');
    expect(window.fetch).not.toHaveBeenCalled();
  });
});
