import './styles/main.css';
import { events } from './services/data.js';
import { calendarFile } from './services/directory.js';
import { logo, eventDetail } from './components/ui.js';
import { homePage } from './pages/home.js';
import { eventsPage, eventFilters, updateEventResults } from './pages/events.js';
import { clubsPage, updateClubResults } from './pages/clubs.js';
import { calendarPage, changeWeek } from './pages/calendar.js';
import { authPage } from './pages/auth.js';

const main = document.querySelector('#main');
const dialog = document.querySelector('#event-dialog');
let filters = {};
let currentRoute = '';

function render() {
  const [path, query = ''] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(query);
  currentRoute = path;
  document.querySelector('#header').innerHTML = `<div class="nav-inner"><a class="brand" href="#/" aria-label="Campus Groups · CCNY home">${logo()}<span>Campus Groups</span><span class="brand-campus">· CCNY</span></a>
    <nav aria-label="Main navigation">${['Events', 'Clubs', 'Calendar'].map(label => `<a href="#/${label.toLowerCase()}" ${path === '/' + label.toLowerCase() ? 'class="active" aria-current="page"' : ''}>${label}</a>`).join('')}<span class="nav-divider"></span><a class="nav-signin" href="#/signin" ${['/signin', '/signup'].includes(path) ? 'aria-current="page"' : ''}>Sign in</a></nav></div>`;
  if (dialog.open) dialog.close();
  main.className = path === '/' ? 'home-main' : '';
  if (path === '/') main.innerHTML = homePage();
  else if (path === '/events') { filters = eventFilters(params); main.innerHTML = eventsPage(params); updateEventResults(filters); }
  else if (path === '/clubs') { main.innerHTML = clubsPage(); updateClubResults(); }
  else if (path === '/calendar') main.innerHTML = calendarPage();
  else if (path === '/signin' || path === '/signup') main.innerHTML = authPage(path === '/signup');
  else main.innerHTML = '<section class="page empty-state"><h1>This path is a little quiet.</h1><p>Let’s find something happening on campus.</p><a class="button dark" href="#/events">Browse events</a></section>';
  const titles = { '/': 'Campus Groups', '/events': 'Campus events', '/clubs': 'Campus clubs', '/calendar': 'This week at CCNY', '/signin': 'Sign in', '/signup': 'Sign up' };
  document.title = `${titles[path] || 'Page not found'} · CCNY`;
}

function syncFilters() {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category !== 'All') params.set('category', filters.category);
  if (filters.club !== 'all') params.set('club', filters.club);
  history.replaceState(null, '', `#/events${params.size ? '?' + params.toString() : ''}`);
  updateEventResults(filters);
}

function authNotice(google = false) {
  const message = document.querySelector('#auth-message');
  message.hidden = false;
  message.textContent = google ? 'Google sign-in isn’t connected yet. You can explore all events and clubs without an account.' : 'Accounts aren’t connected yet. Your details have not been sent or saved. You can browse campus events without signing in.';
}

document.addEventListener('click', event => {
  if (event.target.closest('.skip-link')) {
    event.preventDefault(); main.focus(); main.scrollIntoView(); return;
  }
  if (event.target.closest('#event-dialog a')) dialog.close();
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.event) {
    const item = events.find(e => e.id === Number(target.dataset.event));
    dialog.innerHTML = eventDetail(item);
    dialog.showModal();
  }
  if (target.hasAttribute('data-close')) dialog.close();
  if (target.dataset.download) {
    const item = events.find(e => e.id === Number(target.dataset.download));
    const url = URL.createObjectURL(new Blob([calendarFile(item)], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `campus-event-${item.id}.ics`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (target.dataset.category) { filters.category = target.dataset.category; syncFilters(); }
  if (target.hasAttribute('data-clear-events')) {
    filters = { search: '', category: 'All', club: 'all' };
    document.querySelector('#event-search').value = '';
    document.querySelector('#club-filter').value = 'all';
    syncFilters();
    document.querySelector('#event-search').focus();
  }
  if (target.hasAttribute('data-clear-clubs')) {
    document.querySelector('#club-search').value = '';
    document.querySelector('#club-category').value = 'All';
    updateClubResults();
    document.querySelector('#club-search').focus();
  }
  if (target.dataset.week) {
    changeWeek(target.dataset.week);
    main.innerHTML = calendarPage();
    main.querySelector(`[data-week="${target.dataset.week}"]`)?.focus({ preventScroll: true });
  }
  if (target.hasAttribute('data-google')) authNotice(true);
});

document.addEventListener('input', event => {
  if (event.target.id === 'event-search') { filters.search = event.target.value; syncFilters(); }
  if (event.target.id === 'club-search') updateClubResults(event.target.value, document.querySelector('#club-category').value);
});
document.addEventListener('change', event => {
  if (event.target.id === 'club-filter') { filters.club = event.target.value; syncFilters(); }
  if (event.target.id === 'club-category') updateClubResults(document.querySelector('#club-search').value, event.target.value);
});
document.addEventListener('submit', event => {
  if (event.target.id === 'auth-form') { event.preventDefault(); authNotice(); event.target.reset(); }
});
dialog.addEventListener('click', event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right || event.clientY < dialog.getBoundingClientRect().top || event.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); });
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); main.focus({ preventScroll: true }); });
// Keep the live indicator current after choosing Today, without closing an open event.
setInterval(() => { if (currentRoute === '/calendar' && !dialog.open && !document.activeElement?.matches('button, a, input, select')) main.innerHTML = calendarPage(); }, 60_000);
render();
