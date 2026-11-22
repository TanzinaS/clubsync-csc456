import { followClub, getMe, unfollowClub } from './api.js';

// The one copy of the demo user's followed clubs. Every view reads it from here and
// re-renders through onFollowChange(), so the directory, event details, and the
// personalized views (#113, #114) never disagree.
const followed = new Set();
const pending = new Set();
const listeners = new Set();

export const isFollowing = clubId => followed.has(clubId);
export const isFollowPending = clubId => pending.has(clubId);
export const followedClubIds = () => [...followed];

// Calls listener() after every change, including a request starting or finishing.
// Returns an unsubscribe function.
export function onFollowChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const notify = () => listeners.forEach(listener => listener());

// The API returns the whole user after every follow or unfollow, so the server stays
// the source of truth instead of us guessing the new state.
function applyUser(user) {
  if (!Array.isArray(user?.followed_clubs)) throw new Error('The API returned an unexpected user format.');
  followed.clear();
  user.followed_clubs.forEach(id => followed.add(id));
}

// Restores follows from GET /api/me, so they survive a page refresh.
export async function loadFollows() {
  applyUser(await getMe());
  notify();
}

// Follows or unfollows a club. Ignores repeat clicks while a request for that club runs.
// On failure the previous state stays and the error is rethrown for the caller to show.
export async function toggleFollow(clubId) {
  if (pending.has(clubId)) return;
  const request = followed.has(clubId) ? unfollowClub : followClub;
  pending.add(clubId);
  notify();
  try {
    applyUser(await request(clubId));
  } finally {
    pending.delete(clubId);
    notify();
  }
}
