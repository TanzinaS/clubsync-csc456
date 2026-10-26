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
      <div class="filter-row"><div class="category-filters" aria-label="Filter events by category">${['All', 'Academic', 'Arts', 'Cultural', 'Faith', 'Sports', 'Tech'].map(category => `<button class="filter-pill ${categoryClass(category)}" data-category="${category}" aria-pressed="${filters.category === category}">${category}</button>`).join('')}
      ${CATEGORIES.includes(filters.category) && !['Academic', 'Arts', 'Cultural', 'Faith', 'Sports', 'Tech'].includes(filters.category) ? `<button class="filter-pill ${categoryClass(filters.category)}" data-category="${h(filters.category)}" aria-pressed="true">${h(filters.category)}</button>` : ''}</div>
      <label class="club-select"><span class="sr-only">Filter by club</span><select id="club-filter"><option value="all">All clubs</option>${clubs.map(club => `<option value="${club.id}" ${String(club.id) === filters.club ? 'selected' : ''}>${h(club.name)}</option>`).join('')}</select></label></div>
    </div>
    <div id="events-results" class="timeline"></div>
    <p class="sample-note">A little inspiration for your week. Sample events · October–November 2026.</p>
  </section>`;
}

export function updateEventResults(filters) {
  const filtered = filterEvents(events, filters);
  document.querySelector('#events-count').textContent = `${filtered.length} upcoming event${filtered.length === 1 ? '' : 's'}`;
  document.querySelector('#events-results').innerHTML = filtered.length ? timeline(groupByDay(filtered)) : `<div class="empty-state">${icon('search')}<h2>No events found</h2><p>Try a different search or make a little more room in your filters.</p><button class="button dark" data-clear-events>Clear filters</button></div>`;
  document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === filters.category)));
}
