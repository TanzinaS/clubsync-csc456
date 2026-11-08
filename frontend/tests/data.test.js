import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

// The sample files are the V1 API_CONTRACT shapes for GET /api/clubs and GET /api/events.
const readData = name => JSON.parse(readFileSync(new URL(`../../data/${name}.json`, import.meta.url), 'utf8'));
const apiClubs = readData('sample_clubs');
const apiEvents = readData('sample_events');
const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' },
});

function mockApi({ clubs = apiClubs, events = apiEvents, status = {} } = {}) {
  fetch.mockImplementation(async url => {
    if (url.endsWith('/api/clubs')) return jsonResponse(status.clubs ? { error: 'Data unavailable' } : clubs, status.clubs || 200);
    if (url.endsWith('/api/events')) return jsonResponse(status.events ? { error: 'Data unavailable' } : events, status.events || 200);
    throw new Error(`Unexpected request: ${url}`);
  });
}

// Each test gets fresh module state, so the shared directory starts empty.
const importData = () => import('../src/services/data.js');

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_API_BASE_URL', 'https://clubsync-api.example');
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('loadDirectory', () => {
  it('starts empty and does not request data on import', async () => {
    const { directory } = await importData();

    expect(directory).toEqual({ clubs: [], events: [] });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('loads clubs and events from the API into the shared directory', async () => {
    mockApi();
    const { directory, loadDirectory } = await importData();

    expect(await loadDirectory()).toBe(directory);
    expect(fetch.mock.calls.map(([url]) => url).sort()).toEqual([
      'https://clubsync-api.example/api/clubs',
      'https://clubsync-api.example/api/events',
    ]);
    expect(directory.clubs).toHaveLength(14);
    expect(directory.events).toHaveLength(12);
    // prepareDirectory() still normalizes categories, joins clubs and sorts by start time.
    expect(directory.clubs.find(club => club.id === 6).category).toBe('Tech');
    expect(directory.events.every(event => event.club.id === event.club_id)).toBe(true);
    expect(directory.events.map(event => event.start_time))
      .toEqual([...directory.events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).map(event => event.start_time));
  });

  it('reads the shared state from every importer of the module', async () => {
    mockApi();
    const { loadDirectory } = await importData();
    await loadDirectory();
    const { directory } = await importData();

    expect(directory.events).toHaveLength(12);
  });

  it('shares one request between concurrent callers', async () => {
    mockApi();
    const { loadDirectory } = await importData();

    const [first, second] = await Promise.all([loadDirectory(), loadDirectory()]);
    expect(first).toBe(second);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('handles an empty API response', async () => {
    mockApi({ clubs: [], events: [] });
    const { directory, loadDirectory } = await importData();

    await loadDirectory();
    expect(directory).toEqual({ clubs: [], events: [] });
  });

  it.each([
    ['clubs', { status: { clubs: 500 } }, 'Data unavailable'],
    ['events', { status: { events: 500 } }, 'Data unavailable'],
    ['an event with an unknown club', { events: [{ ...apiEvents[0], club_id: 999 }] }, 'unknown club'],
    ['a non-array response', { clubs: { error: 'nope' } }, 'unexpected directory format'],
  ])('rejects and keeps the directory empty when %s fails', async (_, options, message) => {
    mockApi(options);
    const { directory, loadDirectory } = await importData();

    await expect(loadDirectory()).rejects.toThrow(message);
    expect(directory).toEqual({ clubs: [], events: [] });
  });

  it('rejects with an ApiError when the backend is not running', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    const { loadDirectory } = await importData();
    const { ApiError } = await import('../src/services/api.js');

    await expect(loadDirectory()).rejects.toBeInstanceOf(ApiError);
  });

  it('retries after a failed load', async () => {
    mockApi({ status: { events: 500 } });
    const { directory, loadDirectory } = await importData();
    await expect(loadDirectory()).rejects.toThrow();

    mockApi();
    await loadDirectory();
    expect(directory.events).toHaveLength(12);
  });
});

describe('calendar startup', () => {
  it('does not read events when the calendar module is imported', async () => {
    const { directory } = await importData();
    const events = vi.fn(() => []);
    Object.defineProperty(directory, 'events', { get: events, configurable: true });

    await import('../src/pages/calendar.js');
    expect(events).not.toHaveBeenCalled();
  });

  it('opens on the first loaded event week once initialized', async () => {
    mockApi();
    const { loadDirectory } = await importData();
    const { calendarPage, initCalendar } = await import('../src/pages/calendar.js');

    await loadDirectory();
    initCalendar();
    const html = calendarPage();
    expect(html).toContain('5 events · Mon, Nov 16 to Sun, Nov 22');
    expect(html).toContain('data-event="1"');
  });

  it('renders an empty current week, without crashing, when the load failed', async () => {
    mockApi({ status: { clubs: 500 } });
    const { loadDirectory } = await importData();
    const { calendarPage, initCalendar } = await import('../src/pages/calendar.js');

    await expect(loadDirectory()).rejects.toThrow();
    initCalendar();
    expect(calendarPage()).toContain('0 events');
  });
});

describe('pages before or without data', () => {
  it('render empty results instead of crashing', async () => {
    const { eventsPage } = await import('../src/pages/events.js');
    const { clubsPage } = await import('../src/pages/clubs.js');

    expect(eventsPage(new URLSearchParams())).toContain('<option value="all">All clubs</option></select>');
    expect(clubsPage()).toContain('id="clubs-results"');
  });

  it('list the API clubs in the events club filter after loading', async () => {
    mockApi();
    const { loadDirectory } = await importData();
    const { eventsPage } = await import('../src/pages/events.js');

    await loadDirectory();
    expect(eventsPage(new URLSearchParams({ club: '6' }))).toContain('<option value="6" selected>Robotics Club</option>');
  });
});
