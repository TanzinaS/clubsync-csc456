# ClubSync Project Specification

**Status:** Draft for team review.

**Based on:** `main` at `6a92223`, open PRs, and issues, as of 2026-11-05.

**Companion doc:** [API_CONTRACT.md](API_CONTRACT.md) defines the data shapes and endpoints this spec refers to.

**Where things stand:** the frontend works well but only on bundled sample files. The backend exists but serves different, smaller data. The two have never been connected. Most of the remaining work depends on connecting them, and that starts with agreeing on the contract.

## 1. What ClubSync is

ClubSync is a CCNY campus events and clubs web app. Students browse events, discover and follow clubs, and see a personalized calendar. CCNY club events are currently scattered across flyers, emails, social media, and word of mouth, so ClubSync brings them into one place.

**Goal:** a finished, working, deployed product by the end of the semester, not a demo with hardcoded data. The exact deadline is not recorded in the repo and should be added here.

**Primary users:** CCNY students looking for club events.

**Name to settle:** the repo and backend say ClubSync, but the frontend is branded "Campus Groups · CCNY".

## 2. Tech stack and frameworks

### In use

| Area | Technology | Details |
|---|---|---|
| Frontend | Plain JavaScript modules, HTML, CSS | No UI framework. Hash-based routing. |
| Frontend build | Vite 7 | Requires Node 22.12+, 24, or 26+ |
| Frontend tests | Vitest 5 with V8 coverage | 7 tests in `frontend/tests/` |
| Backend | Python, Flask 3, Flask-Cors | Runs on port 5001 |
| Backend tests | Python `unittest` | 4 tests run on `main` |
| CI | GitHub Actions | `tests.yml` runs backend tests on pull requests to `main` |

### Decisions in progress

| Area | State |
|---|---|
| Database | None connected. Postgres is the leading choice. |
| Authentication | UI preview only. Leaning toward real accounts. |
| Hosting | Not decided for frontend, backend, or database. |
| Frontend CI | PR #53 is open with changes requested. |
| Backend coverage in CI | PR #54 is open and approved. |

## 3. Features

**Status key:** `[Done]` · `[In Progress]` · `[Not Started]`

| Feature | Status | Frontend | Backend |
|---|---|---|---|
| Events feed with search and category/club filtering | `[In Progress]` | Complete on bundled data | List endpoint uses old data. Club filter is in PR #59. No category filter. |
| Weekly calendar view | `[In Progress]` | Complete on bundled data, opens on a sample week with a preview clock | Hides past events, which would empty earlier weeks |
| Club discovery and club pages | `[In Progress]` | Searchable directory works. No page for a single club. | 3 of 14 clubs. No single-club endpoint. |
| Event details view | `[In Progress]` | Detail dialog works on bundled data | Endpoint is in PR #59, not on `main` |
| Follow / unfollow clubs | `[In Progress]` | No follow buttons | Works for clubs 1 to 3 only, in memory, for one demo user |
| Personalized events and calendar for a logged-in user | `[In Progress]` | Not started (#58) | Demo-user endpoint only, on the old data shape. No logged-in users exist. |
| Calendar export (.ics) | `[Done]` | Download works and is tested | Optional second version in PR #56. See section 6. |
| Authentication (sign-up, login, hashed passwords) | `[Not Started]` | Preview forms that send and save nothing | Nothing built |

### Also tracked in FEATURES.md

| Feature | Status | Notes |
|---|---|---|
| Landing page and navigation | `[Done]` | Issue #7 is still open and could be reviewed for closing |
| Google Calendar integration | `[Not Started]` | `.ics` import may be enough. See section 6. |
| RSVP | `[Not Started]` | Proposed, not confirmed |

`FEATURES.md` was last updated on 2026-10-13 and is now out of date. For example, it lists the Events API as Planned.

### Tracking mismatches

- Issues #16 (event details) and #17 (event filtering) are closed, but that code is still only in open PR #59.
- #57 is an issue, not a PR. It lists what the frontend needs from the backend and matches the contract.

## 4. Architecture and components

### Today: two disconnected halves

```text
  FRONTEND (Vite)                         BACKEND (Flask, port 5001)
  pages + components                      api/clubs.py     3 clubs
        |                                 api/events.py    3 events
        v                                 services/demo_user.py
  services/data.js                              |
        |  imported at build time               v
        v                                 In-memory Python records
  data/sample_clubs.json     (14 clubs)
  data/sample_events.json    (12 events)

  No network calls connect the two sides.
```

### Target

```text
  Browser
    |
    v
  FRONTEND: pages -> services/data.js -> fetch
    |
    |  HTTPS + JSON, defined by docs/API_CONTRACT.md
    v
  BACKEND: api/ routes -> services/ business logic
    |
    +-- Phase 1: sample data loaders -> data/*.json
    |
    +-- Phase 2: database (users, clubs, events, follows)
```

### Frontend components

| Path | Role |
|---|---|
| `src/main.js` | Hash router, event handling, detail dialog |
| `src/pages/home.js` | `#/` landing page |
| `src/pages/events.js` | `#/events` timeline with search, category, and club filters |
| `src/pages/clubs.js` | `#/clubs` searchable club directory |
| `src/pages/calendar.js` | `#/calendar` weekly calendar, day-grouped agenda on mobile |
| `src/pages/auth.js` | `#/signin` and `#/signup` preview forms |
| `src/components/ui.js` | Icons, tags, event cards, timeline, event detail |
| `src/services/data.js` | Data boundary. Imports the JSON today, and is where API calls will go. |
| `src/services/directory.js` | Joins, filters, New York dates, `.ics` generation, HTML escaping |
| `src/styles/main.css` | Design tokens and layouts |

### Backend routes on `main`

| Route | Function | File | Notes |
|---|---|---|---|
| `GET /` | `home` | `app.py` | Welcome message |
| `GET /api/health` | `health` | `app.py` | Health check |
| `GET /api/clubs` | `get_clubs` | `api/clubs.py` | 3 in-memory clubs |
| `POST /api/clubs/{id}/follow` | `follow_club_route` | `api/clubs.py` | Demo user, clubs 1 to 3 |
| `POST /api/clubs/{id}/unfollow` | `unfollow_club_route` | `api/clubs.py` | Demo user, clubs 1 to 3 |
| `GET /api/events` | `get_events` | `api/events.py` | 3 in-memory events, upcoming only |
| `GET /api/events/personalized` | `get_personalized_events` | `api/events.py` | Demo user, upcoming only |

Demo user logic is in `services/demo_user.py`. `backend/models/` and `backend/integrations/` are empty.

### Data layer

| Source | Clubs | Events | Used by |
|---|---|---|---|
| `data/*.json` | 14 | 12, from November 16 to December 8, 2026 | Frontend |
| Python records in `backend/api/` | 3 | 3 | Backend |

The two sources disagree on more than size. Club 1 is Math Wizards in the JSON but Computer Science Club in the backend. Events use `start_time` and `end_time` in the JSON but `date` in the backend. The contract makes the JSON shape the single standard.

### Tests and coverage

Results from running both suites on 2026-11-05:

| Suite | Result | Coverage |
|---|---|---|
| Frontend | 7 of 7 pass | 21.81% of lines overall. `directory.js` is at 87.8%. `main.js`, `ui.js`, `data.js`, and all pages are at 0%. |
| Backend | 4 of 4 pass | Not measured on `main`; PR #54 adds this. |

Tests in `tests/backend/` do not run yet, because they cannot be discovered until PR #51 merges.

### Open pull requests

| PR | What it does | Review state | Note |
|---|---|---|---|
| #55 | Sample data loaders | Changes requested | Move to `backend/services/`, add tests |
| #59 | Event details, club filter | Approved | Conflicts with #56. Tests assert the old `date` field. |
| #56 | Backend `.ics` export | Changes requested | Conflicts with #59 |
| #51 | Test discovery in subfolders | Approved | Needed for `tests/backend/` to run |
| #50 | Backend startup test | Changes requested | Has a stray `=` that will fail CI once #51 merges |
| #53 | Frontend CI | Changes requested | Update from `main`, include `data/` changes |
| #54 | Backend coverage in CI | Approved | |
| #60 | Club endpoint tests | Approved | |
| #61 | Event endpoint tests | Approved | Asserts `date` and hidden past events, which the contract changes |
| #62 | Follow and unfollow tests | Approved | |

## 5. What's still needed, by role

Owners come from the README and #57. Please correct anything that has changed.

### Frontend (Denisa)

- [ ] Switch `services/data.js` from bundled JSON to the live API, with `VITE_API_BASE_URL` for the address
- [ ] Add loading and error states, since startup will now depend on a network request
- [ ] Remove the sample-week default and preview clock from the calendar once real data is live
- [ ] Remove `categoryAliases` after the club category migration
- [ ] Add follow and unfollow buttons, keeping state across refresh through `GET /api/me`
- [ ] Build the personalized calendar and feed, with an empty state for no followed clubs (#58)
- [ ] Build a single club page, with the club's info and events
- [ ] Connect the sign-up, sign-in, and sign-out flow, and show the signed-in state in the navigation
- [ ] Remove or hide the "Continue with Google" button unless Google sign-in is approved
- [ ] Raise test coverage: `main.js`, `ui.js`, and all pages are at 0%

### Backend (Sangita, Sarinda, Yazmyrat)

**Move to the contract**

- [ ] Merge the approved event work in #59, then move routes onto the data loaders (#57)
- [ ] Serve all 14 clubs and 12 events in the canonical format, and keep past events (#57)
- [ ] Add `category`, `from`, and `to` filters, and sort events by start time
- [ ] Add `GET /api/clubs/{id}`
- [ ] Add `GET /api/me`
- [ ] Update `/api/events/personalized` to use `start_time`
- [ ] Accept all 14 clubs in follow and unfollow (#57)
- [ ] Return JSON for all errors, including unknown routes and wrong methods

**Real accounts and persistence**

- [ ] Set up the database, models, and migrations in `backend/models/`
- [ ] Load clubs and events into the database from the JSON files, keeping the same IDs
- [ ] Add a users table, `POST /api/auth/signup`, and `POST /api/auth/login`, with salted password hashes
- [ ] Issue tokens and protect the follow, unfollow, personalized, and me endpoints
- [ ] Persist follows per user in the database, replacing `DEMO_USER`

**Ready for production**

- [ ] Run under a production server such as Gunicorn. `app.py` currently starts with `debug=True`.
- [ ] Load secrets and database settings from environment variables, and add `.env.example`
- [ ] Restrict CORS to the deployed frontend's origin

### Data (Yazmyrat)

- [ ] Get the team's agreement on the canonical event and club schema (#27)
- [ ] Finish the loaders in PR #55 (#28)
- [ ] Migrate the 10 club `category` values to the shared list (see the contract, section 3.2)
- [ ] Validate clubs and events: required fields, valid times, and matching `club_id` values (#29)
- [ ] Resolve where real club and event data will come from, and who keeps it current (section 6)
- [ ] Extend or replace the sample schedule. Sample events end on December 8, 2026, so the app will show no upcoming events after that.

### QA (Ayman)

- [ ] Finish the test PRs: fix #50, and merge #51, #60, and #62
- [ ] Update #61 and existing tests to the canonical format
- [ ] Add contract tests that check every endpoint's response against the schemas
- [ ] Add frontend and backend integration tests against a running API
- [ ] Add UI tests for key flows: browse, filter, follow, sign in, personalized calendar, `.ics` download
- [ ] Expand backend coverage once #54 reports it, and agree on a target with the team
- [ ] Complete the manual checks: club endpoints (#31), event endpoints (#32), following (#33), calendar (#34), full demo (#35)

### PM / DevOps (Tanzina)

- [ ] Run the team's review of the API contract and record the outcome
- [ ] Assign owners for the single-club endpoint, database, and authentication
- [ ] Pick the frontend host, backend host, and managed Postgres provider
- [ ] Make `frontend-tests` a required check after #53 merges (#48)
- [ ] Wire deployment into GitHub Actions, with production settings stored as secrets
- [ ] Set up monitoring once deployed, starting with uptime checks on `/api/health` and error logging
- [ ] Update `FEATURES.md` and the README's stack and setup sections
- [ ] Add the real deadline and project board link to the docs
- [ ] Prepare the final demo (#5)

## 6. Key open decisions

| # | Decision | Current position | Blocks | Needed by |
|---|---|---|---|---|
| 1 | **API contract and data format** | Draft ready in `API_CONTRACT.md` | **Almost everything:** #57, frontend integration, QA test updates | Now |
| 2 | **Authentication: demo or real** | Leaning real. The contract supports demo first, then real. | Users table, sign-in UI, personalized view for real users | Now |
| 3 | **Database** | Leaning Postgres | Models, auth, persistent follows | Before auth starts |
| 4 | **Deployment platform** | Not decided | CI deployment, production config, monitoring. Also the managed database choice. | Before auth starts |
| 5 | Token or cookie sessions | Contract proposes bearer tokens | Auth implementation | With decision 2 |
| 6 | `.ics`: frontend only or also backend | Contract proposes keeping the frontend version | PR #56, #23 | Soon |
| 7 | Source of real club and event data | Unknown. Already an open question in `FEATURES.md`. | Moving beyond sample data, and the "not a demo" goal | Before final demo |
| 8 | Can club officers post events? | Open | Roles, and create and edit endpoints, which are not in the contract | Before final demo |
| 9 | Scope of RSVP and Google integrations | RSVP unconfirmed. Google Calendar and Google sign-in not started. | Only scope. Suggest cutting unless time remains. | Soon |
| 10 | Product name | ClubSync vs. Campus Groups | Nothing technical | Before deployment |

## 7. Suggested sequence

1. **Agree on the contract.** Review `API_CONTRACT.md`, settle decisions 1 and 2, and close #27.
2. **Clear the review queue.** Merge #51, then #59, #60, and #62. Finish #55. This avoids building on top of open conflicts.
3. **Make the data canonical.** Migrate the club categories and add validation (#29).
4. **Serve the real data.** Move backend routes onto the loaders, add the missing endpoints, and update the tests together (#57).
5. **Connect the frontend to the API.** Replace the bundled data in `services/data.js` (#3). This is the point where the project first works end to end.
6. **Deploy a first version.** Choose hosts by this step. An early deployment finds CORS and configuration problems while they are still small, and gives every later step a real environment to test in.
7. **Add follows and personalization for the demo user.** Follow buttons, club pages, and the personalized view (#58).
8. **Add the database, then real accounts.** Move data and follows into the database, then add sign-up, login, and protected endpoints, then the frontend sign-in flow.
9. **Finish production setup.** Automated deployment, monitoring, and restricted CORS.
10. **Replace sample data and run the final test.** Bring in real or refreshed data, run the complete demo test (#35), and prepare the demo (#5).

**What can start in parallel now:** the deployment and database decisions, QA test PRs, frontend CI (#53), and frontend coverage work on `directory.js` and pages.
