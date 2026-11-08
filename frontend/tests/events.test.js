import { expect, it } from 'vitest';
import { eventsPage } from '../src/pages/events.js';
import { CATEGORIES } from '../src/services/directory.js';

function categoryButtons(params = new URLSearchParams()) {
  return [...eventsPage(params).matchAll(/<button\b[^>]*data-category="([^"]+)"[^>]*>[^<]*<\/button>/g)]
    .map(([html, category]) => ({ category, pressed: html.includes('aria-pressed="true"'), html }));
}

it('shows All and every shared category exactly once on the default events page', () => {
  const buttons = categoryButtons();

  expect(buttons.map(button => button.category)).toEqual(['All', ...CATEGORIES]);
  expect(buttons.filter(button => button.pressed).map(button => button.category)).toEqual(['All']);
  for (const button of buttons) {
    expect(button.html).toContain(`>${button.category}</button>`);
  }
});

it.each(['Social', 'Community Service', 'Other'])('selects %s without hiding or duplicating other filters', category => {
  const buttons = categoryButtons(new URLSearchParams({ category }));

  expect(buttons.map(button => button.category)).toEqual(['All', ...CATEGORIES]);
  expect(buttons.filter(button => button.pressed).map(button => button.category)).toEqual([category]);
});
