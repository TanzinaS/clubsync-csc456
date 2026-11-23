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
      description: 'A technology workshop for students.',
      location: 'CCNY Campus',
      contact_email: 'robotics@example.com',
      start_time: '2026-11-20T14:00:00-05:00',
      end_time: '2026-11-20T16:00:00-05:00',
      tags: ['Tech'],
    },
    {
      id: 3,
      club_id: 6,
      title: 'First Event',
      description: 'A robotics workshop for students.',
      location: 'CCNY Campus',
      contact_email: 'robotics@example.com',
      start_time: '2026-11-18T14:00:00-05:00',
      end_time: '2026-11-18T16:00:00-05:00',
      tags: ['Tech'],
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
  it('rejects events with invalid times', async () => {
    const invalidEvent = {
      ...events[0],
      start_time: '2026-11-20T16:00:00-05:00',
      end_time: '2026-11-20T14:00:00-05:00',
    };

    getPersonalizedEvents.mockResolvedValue([invalidEvent]);
    getClubs.mockResolvedValue(clubs);

    await expect(loadPersonalizedEvents()).rejects.toThrow();
  });
  it('propagates errors when loading clubs fails', async () => {
    getPersonalizedEvents.mockResolvedValue(events);
    getClubs.mockRejectedValue(new Error('Failed to load clubs'));

    await expect(loadPersonalizedEvents()).rejects.toThrow(
      'Failed to load clubs'
    );
  });
  it('rejects an event referencing a missing club', async () => {
    const missingClubEvent = {
      ...events[0],
      club_id: 999,
    };

    getPersonalizedEvents.mockResolvedValue([missingClubEvent]);
    getClubs.mockResolvedValue(clubs);

    await expect(loadPersonalizedEvents()).rejects.toThrow();
  });
});
