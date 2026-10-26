import { events } from '../services/data.js';
import { dayKey, addDays, startOfWeek, formatDay, formatTime, minutesOfDay, weekEvents, groupByDay, escapeHTML as h } from '../services/directory.js';
import { icon, categoryClass, timeline } from '../components/ui.js';

export const sampleWeek = startOfWeek(dayKey(events[0]?.start_time || new Date()));
export let activeWeek = sampleWeek;
let sampleClock = true;

export function changeWeek(direction) {
  if (direction === 'today') { activeWeek = startOfWeek(dayKey(new Date())); sampleClock = false; }
  else if (direction === 'sample') { activeWeek = sampleWeek; sampleClock = true; }
  else { activeWeek = addDays(activeWeek, Number(direction) * 7); sampleClock = false; }
}

export function calendarPage() {
  const items = weekEvents(events, activeWeek);
  const dates = Array.from({ length: 7 }, (_, i) => addDays(activeWeek, i));
  const current = new Date();
  const clockDay = sampleClock ? activeWeek : dayKey(current);
  const clockMinutes = sampleClock ? 14 * 60 + 50 : minutesOfDay(current);
  const showClock = clockMinutes >= 540 && clockMinutes <= 1320;
  return `<section class="page calendar-page">
    <div class="calendar-heading"><div><p class="eyebrow">${formatDay(activeWeek, { month: 'long', year: 'numeric' })}</p>
      <h1>This week at CCNY</h1><p class="calendar-subtitle">${items.length} event${items.length === 1 ? '' : 's'} · ${formatDay(activeWeek, { weekday: 'short', month: 'short', day: 'numeric' })} to ${formatDay(dates[6], { weekday: 'short', month: 'short', day: 'numeric' })}</p></div>
      <div class="week-nav" aria-label="Calendar navigation"><button class="icon-button" data-week="-1" aria-label="Previous week">${icon('left')}</button><button class="today-button" data-week="today">Today</button><button class="icon-button" data-week="1" aria-label="Next week">${icon('right')}</button></div></div>
    <div class="calendar-context"><span>${sampleClock ? 'Sample week · preview clock' : 'All times Eastern'}</span>${!sampleClock ? '<button class="text-button" data-week="sample">Back to sample week</button>' : '<span>All times Eastern</span>'}</div>
    <div class="week-calendar" aria-label="Weekly schedule">
      <div class="calendar-header"><div></div>${dates.map(date => `<div class="calendar-day ${date === clockDay ? 'current-day' : ''}"><span>${formatDay(date, { weekday: 'short' })}</span><strong ${date === dayKey(current) ? 'aria-current="date"' : ''}>${formatDay(date, { day: 'numeric' })}</strong></div>`).join('')}</div>
      <div class="calendar-body"><div class="time-axis">${Array.from({ length: 14 }, (_, i) => `<span style="top:${i * 60}px">${(i + 9) % 12 || 12} ${i + 9 < 12 ? 'AM' : 'PM'}</span>`).join('')}</div>
      ${dates.map(date => `<div class="day-column ${date === clockDay ? 'current-column' : ''}" aria-label="${formatDay(date, { weekday: 'long', month: 'long', day: 'numeric' })}">
        ${items.filter(e => dayKey(e.start_time) === date).map(event => {
          const start = Math.max(540, minutesOfDay(event.start_time));
          const end = Math.min(1320, minutesOfDay(event.end_time));
          return `<button class="calendar-event ${categoryClass(event.category)}" data-event="${event.id}" style="top:${start - 540}px;height:${Math.max(30, end - start - 3)}px" aria-label="${h(event.title)}, ${formatTime(event.start_time)} to ${formatTime(event.end_time)}, ${h(event.location)}"><strong>${h(event.title)}</strong><span>${formatTime(event.start_time)} to ${formatTime(event.end_time)}</span><span>${h(event.location)}</span></button>`;
        }).join('')}
        ${date === clockDay && showClock ? `<div class="now-line" style="top:${clockMinutes - 540}px" aria-label="${sampleClock ? 'Preview time: 2:50 PM' : `Current time: ${formatTime(current)}`}"></div>` : ''}
      </div>`).join('')}</div>
    </div>
    <div class="mobile-agenda"><p class="agenda-label">Your week, at a glance</p>${items.length ? timeline(groupByDay(items)) : ''}</div>
    ${!items.length ? `<div class="calendar-empty"><h2>A little room in your week.</h2><p>No events scheduled for these dates.</p><button class="button white" data-week="sample">Explore the sample week ${icon('arrow')}</button></div>` : ''}
  </section>`;
}
