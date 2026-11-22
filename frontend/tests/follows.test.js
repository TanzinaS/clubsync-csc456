import { beforeEach, describe, expect, it, vi } from 'vitest';

const user = followed_clubs => ({ id: 1, name: 'Demo User', followed_clubs });

vi.mock('../src/services/api.js', async importOriginal => ({
  ...(await importOriginal()),
  getMe: vi.fn(),
  followClub: vi.fn(),
  unfollowClub: vi.fn(),
}));

// Fresh module state per test, so the shared follow set starts empty.
let api;
let follows;
beforeEach(async () => {
  vi.resetModules();
  api = await import('../src/services/api.js');
  follows = await import('../src/services/follows.js');
  vi.clearAllMocks();
});

describe('follow state', () => {
  it('starts empty and restores followed clubs from GET /api/me', async () => {
    expect(follows.followedClubIds()).toEqual([]);
    api.getMe.mockResolvedValue(user([6, 11]));

    await follows.loadFollows();

    expect(follows.followedClubIds()).toEqual([6, 11]);
    expect(follows.isFollowing(6)).toBe(true);
    expect(follows.isFollowing(1)).toBe(false);
  });

  it('follows and unfollows through the API and takes the state from its response', async () => {
    api.followClub.mockResolvedValue(user([3]));
    await follows.toggleFollow(3);
    expect(api.followClub).toHaveBeenCalledWith(3);
    expect(follows.isFollowing(3)).toBe(true);

    api.unfollowClub.mockResolvedValue(user([]));
    await follows.toggleFollow(3);
    expect(api.unfollowClub).toHaveBeenCalledWith(3);
    expect(follows.isFollowing(3)).toBe(false);
  });

  it('marks the club pending and ignores repeat clicks while a request runs', async () => {
    let finish;
    api.followClub.mockReturnValue(new Promise(resolve => { finish = resolve; }));

    const first = follows.toggleFollow(4);
    expect(follows.isFollowPending(4)).toBe(true);
    await follows.toggleFollow(4);
    expect(api.followClub).toHaveBeenCalledTimes(1);

    finish(user([4]));
    await first;
    expect(follows.isFollowPending(4)).toBe(false);
    expect(follows.isFollowing(4)).toBe(true);
  });

  it('keeps the previous state and rethrows when a request fails', async () => {
    api.getMe.mockResolvedValue(user([2]));
    await follows.loadFollows();
    const error = new api.ApiError('Network request failed');
    api.unfollowClub.mockRejectedValue(error);

    await expect(follows.toggleFollow(2)).rejects.toBe(error);
    expect(follows.isFollowing(2)).toBe(true);
    expect(follows.isFollowPending(2)).toBe(false);
  });

  it('keeps the previous state when the API returns an unexpected user', async () => {
    api.followClub.mockResolvedValue({ error: 'nope' });

    await expect(follows.toggleFollow(5)).rejects.toThrow('unexpected user format');
    expect(follows.followedClubIds()).toEqual([]);
  });

  it('notifies listeners when a request starts and finishes, until they unsubscribe', async () => {
    const listener = vi.fn();
    const unsubscribe = follows.onFollowChange(listener);
    api.followClub.mockResolvedValue(user([7]));

    await follows.toggleFollow(7);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    api.getMe.mockResolvedValue(user([]));
    await follows.loadFollows();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
