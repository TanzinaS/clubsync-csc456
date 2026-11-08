
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach
} from 'vitest';

import {
  getClubs,
  getEvents,
  getMe,
  getPersonalizedEvents
} from '../src/services/api.js';

describe('Frontend API Client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getClubs fetches clubs', async () => {
    const clubs = [{ id: 1, name: 'Math Club' }];

    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => clubs
    });

    const result = await getClubs();

    expect(result).toEqual(clubs);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/clubs'),
      expect.anything()
    );
  });

  it('getEvents returns an empty list', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => []
    });

    const result = await getEvents();

    expect(result).toEqual([]);
  });
});
