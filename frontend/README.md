# Campus Groups · CCNY

A responsive campus directory built with HTML, CSS, JavaScript modules, and Vite. The visual references are preserved in `src/mocks/`.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm. From the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL, normally **http://127.0.0.1:5173**. No Flask server or environment variables are required. To choose another port, run `npm run dev -- --port 5174`.

## Pages and behavior

| Route | Page |
|---|---|
| `#/` | Watercolor campus landing page; category links open filtered events |
| `#/events` | Timeline with combined search, category, and club filters |
| `#/clubs` | Searchable club directory with category filtering and links to club events |
| `#/calendar` | Weekly calendar on desktop and a day-grouped agenda on mobile |
| `#/signin` | Sign-in form and Google sign-in preview |
| `#/signup` | Sign-up form preview |

Filters are reflected in the URL, so filtered views can be bookmarked or shared. Event titles and calendar blocks open an accessible detail dialog. “Add to my calendar” downloads an `.ics` file that can be imported into a calendar application. Escape closes the dialog.

Authentication is **not connected**. Forms validate their inputs and explain this limitation on submission; they do not send or store credentials. Google sign-in also shows an explanatory message. Connect these screens to the eventual authentication service before using real accounts.

## Data

`src/services/data.js` imports the repository's `data/sample_events.json` and `data/sample_clubs.json`; Vite includes these files in the build. There are no duplicate event records in UI code. Edit the JSON files to change the sample schedule, then rebuild for production.

The previously empty events file now contains 12 fictional events across November 16–December 8, 2026. Four clubs were added for the mock's cultural, debate, faith, and soccer events, preserving the existing ten clubs. Category aliases map the original club interests to the nine design categories.

The calendar opens on the first sample event's week, November 16–22, and labels its 2:50 PM Monday preview clock. “Today” switches to the real current week and time in `America/New_York`. Weeks without events show an empty state and a way back to the sample week. The sample events remain visible in the directory after their dates pass so the design can still be demonstrated.

The existing Flask endpoints use separate sample records and a simpler schema. Future API integration belongs in `src/services/data.js`.

## Checks and production build

From `frontend/`:

```bash
npm test
npm run build
npm run preview
```

Tests cover data relationships, combined filters, New York date/time handling, weekly boundaries, HTML escaping, and calendar export. The production bundle is generated in `dist/`; preview normally runs at **http://127.0.0.1:4173**. Hash routes work on static hosting without server rewrite rules.

## Source layout

| Path | Purpose |
|---|---|
| `src/main.js` | Navigation, event handlers, modal lifecycle |
| `src/pages/` | Home, events, clubs, calendar, and authentication views |
| `src/components/ui.js` | Shared icons, event cards, timeline, and detail dialog |
| `src/services/` | JSON loading, filtering, dates, and calendar export |
| `src/styles/main.css` | Design tokens, layouts, responsive rules, and focus states |
| `src/assets/campus-watercolor.png` | Generated clean hero artwork based on the supplied landing mock |
| `src/mocks/` | Original reference screenshots, unchanged |
| `tests/` | Node's built-in test runner; no browser required |

DM Sans is loaded from Google Fonts with system sans-serif fallbacks. All event data and hero artwork are bundled locally.
