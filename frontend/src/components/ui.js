import { escapeHTML as h, formatTime, formatDay, dayKey } from '../services/directory.js';
import { isFollowing, isFollowPending } from '../services/follows.js';

const paths = {
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
  pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  left: '<path d="m14 6-6 6 6 6"/>',
  right: '<path d="m10 6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m0-16a3 3 0 0 1 0 6m3 3a5 5 0 0 1 3 4v3"/>',
};
export const icon = name => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
export const categoryClass = category => `category-${category.toLowerCase().replaceAll(' ', '-')}`;
export const tag = category => `<span class="tag ${categoryClass(category)}">${h(category)}</span>`;
export const logo = () => '<span class="logo-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
export const avatar = club => `<span class="club-avatar ${categoryClass(club.category)}" aria-hidden="true">${h(club.name[0])}</span>`;

// One follow control for club cards and event details. The label stays "Follow <club>"
// and aria-pressed carries the state. While a request runs the button gets aria-disabled
// instead of disabled, so keyboard focus stays on it.
export function followControl(club) {
  const following = isFollowing(club.id);
  return `<span class="follow-control">
    <button class="follow-button${following ? ' following' : ''}" data-follow="${club.id}" aria-label="Follow ${h(club.name)}" aria-pressed="${following}"${isFollowPending(club.id) ? ' aria-disabled="true"' : ''}>${following ? 'Following' : 'Follow'}</button>
    <span class="follow-error" role="status" aria-live="polite"></span>
  </span>`;
}

export function syncFollowButtons(root = document) {
  root.querySelectorAll('[data-follow]').forEach(button => {
    const id = Number(button.dataset.follow);
    const following = isFollowing(id);
    button.setAttribute('aria-pressed', String(following));
    button.classList.toggle('following', following);
    button.textContent = following ? 'Following' : 'Follow';
    if (isFollowPending(id)) button.setAttribute('aria-disabled', 'true');
    else button.removeAttribute('aria-disabled');
  });
}

// index.html ships the same markup so something is visible before the script runs.
export const LOADING_MESSAGE = 'Loading clubs and events…';
export const SLOW_LOADING_MESSAGE = 'Still loading. The server may be waking up, which can take up to a minute.';

export const loadingState = () => `<section class="page load-state">
    <span class="load-spinner" aria-hidden="true"></span>
    <p id="load-status" role="status" aria-live="polite">${LOADING_MESSAGE}</p>
  </section>`;

export const loadError = () => `<section class="page load-state empty-state" role="alert">
    <h1>We couldn’t load clubs and events</h1>
    <p>The server didn’t respond. Check your connection, then try again.</p>
    <button class="button dark" data-retry-load>Try again</button>
  </section>`;

export function eventCard(event) {
  return `<article class="event-card">
    <div class="event-copy">
      <time datetime="${h(event.start_time)}">${formatTime(event.start_time)}</time>
      <h3><button class="event-title" data-event="${event.id}">${h(event.title)}</button></h3>
      <a class="club-byline" href="#/events?club=${event.club_id}">${avatar(event.club)}<span>By ${h(event.club.name)}</span></a>
      <p class="event-location">${icon('pin')}<span>${h(event.location)}</span></p>
      ${tag(event.category)}
    </div>
    <button class="event-thumb ${categoryClass(event.category)}" data-event="${event.id}" aria-label="View ${h(event.title)}" tabindex="-1">${h(event.title[0])}</button>
  </article>`;
}

export function timeline(groups) {
  return groups.map(([date, items]) => `<section class="timeline-day" aria-label="${formatDay(date, { weekday: 'long', month: 'long', day: 'numeric' })}">
    <div class="date-label"><strong>${formatDay(date, { weekday: 'long' })}</strong><span>${formatDay(date, { month: 'long', day: 'numeric' })}</span></div>
    <div class="day-events">${items.map(eventCard).join('')}</div>
  </section>`).join('');
}

export function eventDetail(event) {
  return `<button class="icon-button dialog-close" data-close aria-label="Close event details">${icon('close')}</button>
    ${tag(event.category)}
    <h2 id="dialog-title">${h(event.title)}</h2>
    <div class="detail-club"><p class="club-byline">${avatar(event.club)} By ${h(event.club.name)}</p>${followControl(event.club)}</div>
    <div class="detail-info"><p>${icon('calendar')}<span>${formatDay(dayKey(event.start_time), { weekday: 'long', month: 'long', day: 'numeric' })}<br>${formatTime(event.start_time)} – ${formatTime(event.end_time)} ET</span></p>
    <p>${icon('pin')} ${h(event.location)}</p></div>
    <p class="detail-description">${h(event.description)}</p>
    <button class="button primary full-width" data-download="${event.id}">${icon('calendar')} Add to my calendar</button>
    <a class="detail-club-link" href="#/events?club=${event.club_id}">More from ${h(event.club.name)} ${icon('arrow')}</a>`;
}
