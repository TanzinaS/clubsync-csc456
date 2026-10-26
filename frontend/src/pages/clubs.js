import { clubs, events } from '../services/data.js';
import { CATEGORIES, escapeHTML as h } from '../services/directory.js';
import { categoryClass, icon, tag } from '../components/ui.js';

export function clubsPage() {
  return `<section class="page clubs-page">
    <div class="clubs-intro"><p class="eyebrow">Find your people</p><h1>A place for every interest.</h1><p>Discover your community, try something new, and make campus your own.</p></div>
    <div class="club-directory-tools"><label class="search-box">${icon('search')}<input id="club-search" type="search" placeholder="Search clubs and interests…" aria-label="Search clubs and interests"></label>
    <label class="club-select"><span class="sr-only">Club category</span><select id="club-category"><option value="All">All categories</option>${CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select></label></div>
    <p class="results-count" id="clubs-count" role="status" aria-live="polite"></p>
    <div class="club-grid" id="clubs-results"></div>
  </section>`;
}

export function updateClubResults(search = '', category = 'All') {
  const query = search.trim().toLowerCase();
  const filtered = clubs.filter(club => (category === 'All' || club.category === category) && `${club.name} ${club.description} ${club.category}`.toLowerCase().includes(query));
  document.querySelector('#clubs-count').textContent = `${filtered.length} club${filtered.length === 1 ? '' : 's'} to discover`;
  document.querySelector('#clubs-results').innerHTML = filtered.length ? filtered.map(club => {
    const count = events.filter(e => e.club_id === club.id).length;
    return `<article class="club-card"><div class="club-card-top"><div class="club-monogram ${categoryClass(club.category)}" aria-hidden="true">${h(club.name.split(' ').slice(0, 2).map(w => w[0]).join(''))}</div>${tag(club.category)}</div>
      <h2>${h(club.name)}</h2><p>${h(club.description)}</p>
      <div class="club-card-bottom"><span>${count} event${count === 1 ? '' : 's'}</span><a href="#/events?club=${club.id}" aria-label="View events from ${h(club.name)}">View events ${icon('arrow')}</a></div></article>`;
  }).join('') : `<div class="empty-state">${icon('people')}<h2>No clubs found</h2><p>There’s a community for you. Try another search.</p><button class="button dark" data-clear-clubs>Clear filters</button></div>`;
}
