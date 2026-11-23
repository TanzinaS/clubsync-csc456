
import { test, expect } from '@playwright/test';

test('home page loads and displays events from Flask', async ({ page, request }) => {
  // Keep the test date fixed so sample events remain upcoming.
  await page.clock.setFixedTime(new Date('2026-11-16T09:00:00-05:00'));

  // Get real events directly from the Flask backend.
  const response = await request.get('http://127.0.0.1:5001/api/events');
  expect(response.ok()).toBeTruthy();

  const events = await response.json();
  expect(Array.isArray(events)).toBe(true);
  expect(events.length).toBeGreaterThan(0);

  // Open the ClubSync home page.
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /Everything happening on campus/i })
  ).toBeVisible();

  // Navigate to the events page.
  await page.getByRole('link', { name: /Browse events/i }).click();

  await expect(
    page.getByRole('heading', { name: 'Campus events' })
  ).toBeVisible();

  // Verify the page displays at least one event from Flask.
  const fixedNow = new Date('2026-11-16T09:00:00-05:00');

  const eventTitles = events
    .filter(event => new Date(event.end_time) > fixedNow)
    .map(event => event.title);
  const results = page.locator('#events-results');

  await expect.poll(async () => {
    const text = await results.innerText();
    return eventTitles.some(title => text.includes(title));
  }).toBe(true);
});
