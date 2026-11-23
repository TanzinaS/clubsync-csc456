import { getPersonalizedEvents, getClubs } from './api.js';
import { prepareDirectory } from './directory.js';
import { directory } from './data.js';

export async function loadPersonalizedEvents() {
  const events = await getPersonalizedEvents();
  const clubs = directory.clubs.length
    ? directory.clubs
    : await getClubs();

  return prepareDirectory(clubs, events).events;
}