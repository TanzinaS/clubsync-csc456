import { clubs, events } from '../services/data.js';
import { CATEGORIES, escapeHTML as h, filterEvents, groupByDay } from '../services/directory.js';
import { categoryClass, icon, timeline } from '../components/ui.js';

export function eventFilters(params) {
  return { search: params.get('search') || '', category: params.get('category') || 'All', club: params.get('club') || 'all' };
}

export function eventsPage(params) {
  const filters = eventFilters(params);
  return `<section class="page events-page">
    <div class="page-heading"><h1>Campus events</h1><p id="events-count" role="status" aria-live="polite"></p></div>
    <div class="filters">
      <label class="search-box">${icon('search')}<input id="event-search" type="search" placeholder="Search events, clubs, places…" aria-label="Search events, clubs, places" value="${h(filters.search)}" autocomplete="off"></label>
      <div class="filter-row"><div class="category-filters" aria-label="Filter events by category">${['All', ...CATEGORIES].map(category => `<button class="filter-pill ${categoryClass(category)}" data-category="${category}" aria-pressed="${filters.category === category}">${category}</button>`).join('')}</div>
      <label class="club-select"><span class="sr-only">Filter by club</span><select id="club-filter"><option value="all">All clubs</option>${clubs.map(club => `<option value="${club.id}" ${String(club.id) === filters.club ? 'selected' : ''}>${h(club.name)}</option>`).join('')}</select></label></div>
    </div>
    <div id="events-results" class="timeline"></div>
    <p class="sample-note">A little inspiration for your week. Explore sample campus events.</p>
  </section>`;
}

// Timestamps carry their New York offset (API_CONTRACT 3.3), so comparing instants is
// zone-independent. An event stays upcoming until its end_time has passed.
export const isUpcoming = (event, now = new Date()) => new Date(event.end_time) > now;

export function eventResults(filters, { source = events, now = new Date() } = {}) {
  const upcoming = source.filter(event => isUpcoming(event, now));
  const filtered = filterEvents(upcoming, filters);
  const count = `${filtered.length} upcoming event${filtered.length === 1 ? '' : 's'}`;
  if (filtered.length) return { count, html: timeline(groupByDay(filtered)) };
  if (!upcoming.length) return { count, html: `<div class="empty-state">${icon('calendar')}<h2>No upcoming events</h2><p>Nothing is scheduled yet. Check back soon, or look back at past weeks on the calendar.</p><a class="button dark" href="#/calendar">Open the calendar</a></div>` };
  return { count, html: `<div class="empty-state">${icon('search')}<h2>No events found</h2><p>Try a different search or make a little more room in your filters.</p><button class="button dark" data-clear-events>Clear filters</button></div>` };
}

export function updateEventResults(filters) {
  const { count, html } = eventResults(filters);
  document.querySelector('#events-count').textContent = count;
  document.querySelector('#events-results').innerHTML = html;
  document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === filters.category)));
}
