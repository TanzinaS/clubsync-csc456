import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventsPage, eventResults, isUpcoming, updateEventResults } from '../src/pages/events.js';
import { calendarPage } from '../src/pages/calendar.js';
import { CATEGORIES, prepareDirectory, weekEvents } from '../src/services/directory.js';

function categoryButtons(params = new URLSearchParams()) {
  return [...eventsPage(params).matchAll(/<button\b[^>]*data-category="([^"]+)"[^>]*>[^<]*<\/button>/g)]
    .map(([html, category]) => ({ category, pressed: html.includes('aria-pressed="true"'), html }));
}

it('shows All and every shared category exactly once on the default events page', () => {
  const buttons = categoryButtons();

  expect(buttons.map(button => button.category)).toEqual(['All', ...CATEGORIES]);
  expect(buttons.filter(button => button.pressed).map(button => button.category)).toEqual(['All']);
  for (const button of buttons) {
    expect(button.html).toContain(`>${button.category}</button>`);
  }
});

it.each(['Social', 'Community Service', 'Other'])('selects %s without hiding or duplicating other filters', category => {
  const buttons = categoryButtons(new URLSearchParams({ category }));

  expect(buttons.map(button => button.category)).toEqual(['All', ...CATEGORIES]);
  expect(buttons.filter(button => button.pressed).map(button => button.category)).toEqual([category]);
});

describe('upcoming events feed', () => {
  // Mocked rows in the API_CONTRACT shapes (sections 3.2 and 3.3), with New York offsets.
  const { events: mockEvents } = prepareDirectory([
    { id: 1, name: 'Math Wizards', category: 'Mathematics', description: 'Proofs.', contact_email: 'contact@mathwizards.example' },
    { id: 6, name: 'Robotics Club', category: 'Engineering', description: 'Robots.', contact_email: 'contact@roboticsclub.example' },
  ], [
    { id: 10, club_id: 1, title: 'Ended Proof Session', description: 'Done.', start_time: '2026-11-16T09:00:00-05:00', end_time: '2026-11-16T10:00:00-05:00', location: 'NAC 4/120', tags: ['Academic'] },
    { id: 11, club_id: 6, title: 'Ongoing Build Night', description: 'Now.', start_time: '2026-11-16T11:00:00-05:00', end_time: '2026-11-16T15:00:00-05:00', location: 'Marshak 418', tags: ['Tech'] },
    { id: 12, club_id: 1, title: 'Later Puzzle Hour', description: 'Soon.', start_time: '2026-11-18T12:00:00-05:00', end_time: '2026-11-18T13:00:00-05:00', location: 'NAC 4/120', tags: ['Academic'] },
  ]);
  // 12:00 PM in New York on Mon, Nov 16, 2026: event 10 has ended, event 11 is in progress.
  const now = new Date('2026-11-16T17:00:00Z');
  const noFilters = { search: '', category: 'All', club: 'all' };
  const shownIds = html => [...html.matchAll(/class="event-title" data-event="(\d+)"/g)].map(([, id]) => Number(id));

  it('excludes an event whose end_time has passed and keeps one still in progress', () => {
    const { html } = eventResults(noFilters, { source: mockEvents, now });

    expect(shownIds(html)).toEqual([11, 12]);
  });

  it('treats an event as ended exactly at its end_time, independent of the offset format', () => {
    const event = mockEvents.find(e => e.id === 11);

    expect(isUpcoming(event, new Date('2026-11-16T19:59:59Z'))).toBe(true);
    expect(isUpcoming(event, new Date('2026-11-16T20:00:00Z'))).toBe(false);
    expect(isUpcoming({ ...event, end_time: '2026-11-16T14:59:59-05:00' }, new Date('2026-11-16T15:00:00-05:00'))).toBe(false);
  });

  it('counts only the upcoming events that match the filters', () => {
    expect(eventResults(noFilters, { source: mockEvents, now }).count).toBe('2 upcoming events');
    expect(eventResults({ ...noFilters, category: 'Academic' }, { source: mockEvents, now }).count).toBe('1 upcoming event');
    expect(eventResults({ ...noFilters, search: 'proof' }, { source: mockEvents, now }).count).toBe('0 upcoming events');
  });

  it('says there are no upcoming events when every event has ended', () => {
    const { count, html } = eventResults(noFilters, { source: mockEvents, now: new Date('2026-12-01T00:00:00Z') });

    expect(count).toBe('0 upcoming events');
    expect(html).toContain('No upcoming events');
    expect(html).not.toContain('No events found');
    expect(html).not.toContain('data-clear-events');
  });

  it('says no events match when upcoming events exist but the filters hide them', () => {
    const { html } = eventResults({ ...noFilters, search: 'proof' }, { source: mockEvents, now });

    expect(html).toContain('No events found');
    expect(html).toContain('data-clear-events');
    expect(html).not.toContain('No upcoming events');
  });

  it('does not change the shared events the calendar reads', () => {
    const before = [...mockEvents];
    eventResults(noFilters, { source: mockEvents, now: new Date('2026-12-01T00:00:00Z') });

    expect(mockEvents).toEqual(before);
    expect(weekEvents(mockEvents, '2026-11-16').map(event => event.id)).toEqual([10, 11, 12]);
  });

  describe('with the page data and a fixed clock', () => {
    let elements;
    beforeEach(() => {
      vi.useFakeTimers();
      elements = { '#events-count': {}, '#events-results': {} };
      vi.stubGlobal('document', { querySelector: selector => elements[selector], querySelectorAll: () => [] });
    });
    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it('updates the feed from the current time while the calendar keeps past events', () => {
      vi.setSystemTime(new Date('2026-11-24T12:00:00-05:00'));
      updateEventResults(noFilters);

      expect(elements['#events-count'].textContent).toBe('6 upcoming events');
      expect(calendarPage()).toContain('5 events · Mon, Nov 16 to Sun, Nov 22');
    });
  });
});
