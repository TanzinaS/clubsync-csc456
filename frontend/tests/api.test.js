
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import {
  ApiError,
  apiGet,
  apiPost,
  getClubs,
  getEvents,
  getMe,
  getPersonalizedEvents,
  followClub,
  unfollowClub
} from '../src/services/api.js';

const user = {
  id: 1,
  name: 'Demo User',
  followed_clubs: [6]
};

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv('VITE_API_BASE_URL', '');
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('V1 API client', () => {

  it.each([undefined, '', '   '])(
    'uses the local fallback when the configured URL is %j',
    async baseUrl => {
      vi.stubEnv('VITE_API_BASE_URL', baseUrl);
      fetch.mockResolvedValue(jsonResponse(user));

      expect(await getMe()).toEqual(user);

      expect(fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5001/api/me',
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: expect.any(AbortSignal)
        }
      );

      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it.each([
    [getClubs, '/api/clubs'],
    [getEvents, '/api/events'],
    [getMe, '/api/me'],
    [getPersonalizedEvents, '/api/events/personalized']
  ])(
    'uses the configured origin and exact V1 GET path for %s',
    async (call, path) => {
      vi.stubEnv(
        'VITE_API_BASE_URL',
        ' https://clubsync-api.example/ '
      );

      fetch.mockResolvedValue(jsonResponse([]));

      await call();

      expect(fetch).toHaveBeenCalledExactlyOnceWith(
        `https://clubsync-api.example${path}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: expect.any(AbortSignal)
        }
      );
    }
  );

  it.each([
    [followClub, '/api/clubs/6/follow'],
    [unfollowClub, '/api/clubs/6/unfollow']
  ])(
    'sends a bodyless POST and returns the updated user for %s',
    async (call, path) => {
      fetch.mockResolvedValue(jsonResponse(user));

      expect(await call(6)).toEqual(user);

      expect(fetch).toHaveBeenCalledExactlyOnceWith(
        `http://127.0.0.1:5001${path}`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
          signal: expect.any(AbortSignal)
        }
      );

      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it.each([
    [apiGet, 'GET', '/api/me'],
    [apiPost, 'POST', '/api/clubs/6/follow']
  ])(
    'exposes the shared %s helper',
    async (call, method, path) => {
      fetch.mockResolvedValue(jsonResponse(user));

      expect(await call(path)).toEqual(user);

      expect(fetch).toHaveBeenCalledWith(
        `http://127.0.0.1:5001${path}`,
        expect.objectContaining({ method })
      );
    }
  );

  it.each([
    [400, 'Invalid club_id'],
    [404, 'Club not found'],
    [405, 'Method not allowed'],
    [500, 'Data unavailable']
  ])(
    'preserves the contract error message and HTTP %i status',
    async (status, message) => {
      fetch.mockResolvedValue(
        jsonResponse({ error: message }, status)
      );

      await expect(followClub(999)).rejects.toMatchObject({
        name: 'ApiError',
        message,
        status
      });

      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it.each([
    null,
    {},
    { error: '' },
    { error: 42 }
  ])(
    'handles an unexpected error body: %j',
    async body => {
      fetch.mockResolvedValue(jsonResponse(body, 500));

      await expect(getMe()).rejects.toMatchObject({
        name: 'ApiError',
        message: 'Request failed (HTTP 500)',
        status: 500
      });
    }
  );

  it('handles an HTML error response without exposing the response body', async () => {
    fetch.mockResolvedValue(
      new Response('<html>Internal server details</html>', {
        status: 502
      })
    );

    await expect(getMe()).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Request failed (HTTP 502)',
      status: 502
    });
  });

  it('rejects malformed JSON in a successful response', async () => {
    fetch.mockResolvedValue(
      new Response('not JSON', { status: 200 })
    );

    await expect(getMe()).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Invalid JSON response',
      status: 200
    });

    expect(vi.getTimerCount()).toBe(0);
  });

  it('wraps network failures in the same error type', async () => {
    fetch.mockRejectedValue(
      new TypeError('Failed to fetch')
    );

    const failure = getMe();

    await expect(failure).rejects.toBeInstanceOf(ApiError);

    await expect(failure).rejects.toMatchObject({
      message: 'Network request failed',
      status: null
    });

    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports a body-read network failure after successful headers as a network error', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.error(
          new TypeError('Connection terminated')
        );
      }
    });

    fetch.mockResolvedValue(
      new Response(body, { status: 200 })
    );

    const failure = getMe();

    await expect(failure).rejects.toBeInstanceOf(ApiError);

    await expect(failure).rejects.toMatchObject({
      message: 'Network request failed',
      status: null
    });

    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['headers', 'body'])(
    'aborts after 15 seconds while waiting for %s',
    async phase => {
      let signal;

      fetch.mockImplementation((_url, options) => {
        signal = options.signal;

        const pending = () =>
          new Promise((_resolve, reject) => {
            signal.addEventListener(
              'abort',
              () => reject(
                new DOMException('Aborted', 'AbortError')
              ),
              { once: true }
            );
          });

        return phase === 'headers'
          ? pending()
          : Promise.resolve({
              ok: true,
              status: 200,
              json: pending
            });
      });

      const failure = getMe();

      const assertion = expect(failure).rejects.toMatchObject({
        name: 'ApiError',
        message: 'Request timed out',
        status: null
      });

      await vi.advanceTimersByTimeAsync(14_999);

      expect(signal.aborted).toBe(false);

      await vi.advanceTimersByTimeAsync(1);

      await assertion;

      expect(signal.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  // Additional response-data tests for Issue #71

  const club = {
    id: 6,
    name: 'Robotics Club',
    category: 'Engineering',
    description: 'We design, build, & program robots!',
    contact_email: 'contact@roboticsclub.example'
  };

  const event = {
    id: 3,
    club_id: 6,
    title: 'Build Night: Line-Following Bots',
    description: 'Build a tiny robot.',
    start_time: '2026-11-17T14:00:00-05:00',
    end_time: '2026-11-17T16:00:00-05:00',
    location: 'Marshak 418 · MakerLab',
    tags: ['Tech']
  };

  it.each([
    [
      getClubs,
      '/api/clubs',
      [
        club,
        { ...club, id: 7, name: 'Let it Bloom!' }
      ]
    ],
    [
      getEvents,
      '/api/events',
      [
        event,
        { ...event, id: 4 }
      ]
    ],
    [
      getPersonalizedEvents,
      '/api/events/personalized',
      [event]
    ]
  ])(
    '%s returns the complete API response unchanged',
    async (call, path, rows) => {
      fetch.mockResolvedValue(jsonResponse(rows));

      const result = await call();

      expect(result).toStrictEqual(rows);

      expect(fetch).toHaveBeenCalledExactlyOnceWith(
        `http://127.0.0.1:5001${path}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: expect.any(AbortSignal)
        }
      );
    }
  );

  it.each([
    [getClubs, '/api/clubs'],
    [getEvents, '/api/events'],
    [getPersonalizedEvents, '/api/events/personalized']
  ])(
    '%s returns an empty array for an empty API response',
    async (call, path) => {
      fetch.mockResolvedValue(jsonResponse([]));

      const result = await call();

      expect(result).toStrictEqual([]);

      expect(fetch).toHaveBeenCalledExactlyOnceWith(
        `http://127.0.0.1:5001${path}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: expect.any(AbortSignal)
        }
      );
    }
  );

});
