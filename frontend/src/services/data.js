import rawEvents from '../../../data/sample_events.json';
import rawClubs from '../../../data/sample_clubs.json';
import { prepareDirectory } from './directory.js';

// Vite loads the repository JSON directly and includes it in production builds.
// Replace this boundary with API requests when the backend supports this schema.
export const { clubs, events } = prepareDirectory(rawClubs, rawEvents);
