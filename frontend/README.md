# Frontend

The user interface for ClubSync — everything students see and interact with.

**Owner:** Denisa (Frontend Developer)
**Framework:** Not decided yet. This structure works with plain HTML/CSS/JS or a framework.

## Folders

| Folder | Purpose | Examples |
|---|---|---|
| `src/components/` | Reusable UI pieces used on multiple pages | Navigation bar, event card, club card |
| `src/pages/` | Full screens a user navigates to | Landing page, events feed, calendar, club page |
| `src/services/` | Code that requests data from the backend | Fetching events, fetching clubs |
| `src/styles/` | Stylesheets and shared colors/fonts | Global styles, layout |

## Working Without the Backend

Until the backend API exists, use the sample data in `/data` (`sample_clubs.json`, `sample_events.json`). Keep data loading inside `src/services/` so switching to the real API later only requires changes in one place.

## Setup

Setup instructions will be added once the framework is chosen.
