
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getPersonalizedEvents,
  getClubs,
} from '../src/services/api.js';

import { loadPersonalizedEvents } from '../src/services/personalized.js';

vi.mock('../src/services/api.js', () => ({
  getPersonalizedEvents: vi.fn(),
  getClubs: vi.fn(),
}));

describe('Personalized events service', () => {
  const clubs = [
    {
      id: 6,
      name: ' Robotics Club ',
      category: 'Engineering',
    },
  ];

  const events = [
    {
      id: 4,
      club_id: 6,
      title: 'Second Event',
      start_time: '2026-11-20T14:00:00-05:00',
      end_time: '2026-11-20T16:00:00-05:00',
      tags: ['Tech'],
    },
    {
      id: 3,
      club_id: 6,
      title: 'First Event',
      start_time: '2026-11-18T14:00:00-05:00',
      end_time: '2026-11-18T16:00:00-05:00',
      tags: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads, prepares, and sorts personalized events', async () => {
    getPersonalizedEvents.mockResolvedValue(events);
    getClubs.mockResolvedValue(clubs);

    const result = await loadPersonalizedEvents();

    expect(result.map(event => event.id)).toEqual([3, 4]);
    expect(result[0].club.name).toBe('Robotics Club');
    expect(result[0].club.category).toBe('Tech');
    expect(result[0].category).toBe('Tech');

    expect(getPersonalizedEvents).toHaveBeenCalledOnce();
    expect(getClubs).toHaveBeenCalledOnce();
  });

  it('returns an empty list when there are no personalized events', async () => {
    getPersonalizedEvents.mockResolvedValue([]);
    getClubs.mockResolvedValue(clubs);

    await expect(loadPersonalizedEvents()).resolves.toEqual([]);
  });

  it('propagates API errors', async () => {
    getPersonalizedEvents.mockRejectedValue(
      new Error('Network request failed')
    );
    getClubs.mockResolvedValue(clubs);

    await expect(loadPersonalizedEvents()).rejects.toThrow(
      'Network request failed'
    );
  });
});
