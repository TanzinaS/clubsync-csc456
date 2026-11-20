import { getClubs, getEvents } from './api.js';
import { prepareDirectory } from './directory.js';

// The one shared directory every page reads. It stays empty until loadDirectory() succeeds.
export const directory = { clubs: [], events: [] };

let pending = null;

export function loadDirectory() {
  pending ||= Promise.all([getClubs(), getEvents()]).then(([clubs, events]) => {
    if (!Array.isArray(clubs) || !Array.isArray(events)) throw new Error('The API returned an unexpected directory format.');
    // prepareDirectory() throws on bad records, so a failed load never leaves partial data behind.
    Object.assign(directory, prepareDirectory(clubs, events));
    return directory;
  });
  // Forget a failed load so a later call can retry it.
  pending.catch(() => { pending = null; });
  return pending;
}
