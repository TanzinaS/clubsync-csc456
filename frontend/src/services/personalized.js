
import { getPersonalizedEvents, getClubs } from './api.js';
import { prepareDirectory } from './directory.js';

export async function loadPersonalizedEvents() {
  const [events, clubs] = await Promise.all([
    getPersonalizedEvents(),
    getClubs(),
  ]);

  return prepareDirectory(clubs, events).events;
}
