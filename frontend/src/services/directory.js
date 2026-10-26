export const CATEGORIES = ['Tech', 'Cultural', 'Arts', 'Academic', 'Sports', 'Faith', 'Social', 'Community Service', 'Other'];
export const TIME_ZONE = 'America/New_York';

const categoryAliases = {
  Mathematics: 'Academic', Gaming: 'Tech', 'Culinary arts': 'Social',
  Media: 'Arts', Science: 'Academic', Engineering: 'Tech',
  Gardening: 'Community Service', Outdoor: 'Sports', Games: 'Social', Literature: 'Arts',
};

export function normalizeCategory(category) {
  return categoryAliases[category] || (CATEGORIES.includes(category) ? category : 'Other');
}

export function prepareDirectory(rawClubs, rawEvents) {
  const clubs = rawClubs.map(club => ({ ...club, name: club.name.trim(), category: normalizeCategory(club.category) }));
  const byId = new Map(clubs.map(club => [club.id, club]));
  const events = rawEvents.map(event => {
    const club = byId.get(event.club_id);
    if (!club) throw new Error(`Event ${event.id} references an unknown club.`);
    if (!(new Date(event.end_time) > new Date(event.start_time))) throw new Error(`Event ${event.id} has invalid times.`);
    return { ...event, club, category: normalizeCategory(event.tags?.[0] || club.category) };
  }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  return { clubs, events };
}

export function filterEvents(events, { search = '', category = 'All', club = 'all' } = {}) {
  const query = search.trim().toLocaleLowerCase();
  return events.filter(event =>
    (category === 'All' || event.category === category) &&
    (club === 'all' || String(event.club_id) === String(club)) &&
    `${event.title} ${event.club.name} ${event.location}`.toLocaleLowerCase().includes(query)
  );
}

export function dayKey(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
}

export function addDays(key, count) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function startOfWeek(key) {
  const weekday = new Date(`${key}T12:00:00Z`).getUTCDay();
  return addDays(key, -(weekday === 0 ? 6 : weekday - 1));
}

export function formatDay(key, options) {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: TIME_ZONE }).format(new Date(`${key}T12:00:00Z`));
}

export function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit' }).format(new Date(date));
}

export function minutesOfDay(date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(date));
  return Number(parts.find(p => p.type === 'hour').value) * 60 + Number(parts.find(p => p.type === 'minute').value);
}

export function weekEvents(events, week) {
  return events.filter(event => dayKey(event.start_time) >= week && dayKey(event.start_time) < addDays(week, 7));
}

export function groupByDay(events) {
  return Object.entries(events.reduce((groups, event) => {
    (groups[dayKey(event.start_time)] ||= []).push(event);
    return groups;
  }, {}));
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

export function calendarFile(event) {
  const stamp = value => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escape = value => String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Campus Groups CCNY//Events//EN', 'BEGIN:VEVENT',
    `UID:campus-groups-${event.id}@ccny.example`, `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(event.start_time)}`, `DTEND:${stamp(event.end_time)}`,
    `SUMMARY:${escape(event.title)}`, `LOCATION:${escape(event.location)}`, `DESCRIPTION:${escape(event.description)}`,
    'END:VEVENT', 'END:VCALENDAR'];
  // Fold at UTF-8 octet boundaries so imported calendars retain long descriptions.
  return lines.map(line => {
    let folded = '', bytes = 0;
    for (const char of line) {
      const size = new TextEncoder().encode(char).length;
      if (bytes + size > 75) { folded += '\r\n '; bytes = 1; }
      folded += char; bytes += size;
    }
    return folded;
  }).join('\r\n') + '\r\n';
}
