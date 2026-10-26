import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareDirectory, filterEvents, dayKey, startOfWeek, addDays, weekEvents, minutesOfDay, calendarFile, escapeHTML } from '../src/services/directory.js';

const readData = name => JSON.parse(readFileSync(new URL(`../../data/${name}.json`, import.meta.url), 'utf8'));
const { clubs, events } = prepareDirectory(readData('sample_clubs'), readData('sample_events'));

test('sample records join valid clubs and have chronological, valid times', () => {
  assert.equal(events.length, 12);
  assert.equal(new Set(events.map(e => e.id)).size, events.length);
  assert.equal(new Set(clubs.map(c => c.id)).size, clubs.length);
  for (const event of events) {
    assert.ok(event.club.name);
    assert.ok(new Date(event.end_time) > new Date(event.start_time));
    assert.ok(event.description && event.location);
  }
  assert.equal(clubs.find(c => c.id === 6).category, 'Tech');
  assert.equal(clubs.find(c => c.id === 3).name, 'Baking club');
});

test('search matches title, club and location, case-insensitively', () => {
  assert.equal(filterEvents(events, { search: '  BACHATA  ' })[0].id, 1);
  assert.equal(filterEvents(events, { search: 'robotics' })[0].id, 3);
  assert.equal(filterEvents(events, { search: 'MakerLab' })[0].id, 3);
  assert.equal(filterEvents(events, { search: 'nothing matches this' }).length, 0);
});

test('category, club and search filters intersect and can return no results', () => {
  assert.equal(filterEvents(events, { category: 'Tech' }).length, 2);
  assert.deepEqual(filterEvents(events, { category: 'Tech', club: '6', search: 'Marshak' }).map(e => e.id), [3]);
  assert.equal(filterEvents(events, { category: 'Arts', club: '6' }).length, 0);
  assert.equal(filterEvents(events, { club: '9' }).length, 0);
  assert.equal(filterEvents(events).length, 12);
});

test('campus dates and time positions use New York time, independent of browser zone', () => {
  assert.equal(dayKey('2026-10-13T02:00:00Z'), '2026-10-12');
  assert.equal(minutesOfDay('2026-10-13T17:00:00Z'), 13 * 60);
  assert.equal(startOfWeek('2026-10-18'), '2026-10-12');
  assert.equal(startOfWeek('2026-10-19'), '2026-10-19');
  assert.equal(addDays('2026-12-28', 7), '2027-01-04');
  assert.equal(addDays('2026-11-01', 1), '2026-11-02');
});

test('week navigation partitions sample events and supports empty weeks', () => {
  assert.equal(weekEvents(events, '2026-10-12').length, 6);
  assert.equal(weekEvents(events, '2026-10-19').length, 6);
  assert.equal(weekEvents(events, '2026-10-26').length, 0);
});

test('calendar exports UTC timestamps, escaped content and folded lines', () => {
  const file = calendarFile({ ...events[0], description: 'Hello, campus;\n' + 'é'.repeat(80) });
  assert.ok(file.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(file.includes('DTSTART:20261013T170000Z'));
  assert.ok(file.includes('DTEND:20261013T190000Z'));
  assert.ok(file.includes('Hello\\, campus\\;\\n'));
  assert.ok(file.endsWith('END:VCALENDAR\r\n'));
  for (const line of file.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
});

test('rendered data cannot inject HTML', () => {
  assert.equal(escapeHTML('<img src="x" onerror=\'bad\'>&'), '&lt;img src=&quot;x&quot; onerror=&#39;bad&#39;&gt;&amp;');
});
