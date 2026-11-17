# ClubSync Project Specification

**Status:** Draft for team review. **Proposed items are not approved.** The V1 scope was confirmed by the PM on November 5, 2026. See V1 Scope in [API_CONTRACT.md](API_CONTRACT.md#v1-scope--confirmed-pm-decisions-november-5-2026). Where this spec differs from it, the V1 scope wins.

**Based on:** `main` at `5531d16`, open PRs, and issues, as of 2026-11-05.

**Companion doc:** [API_CONTRACT.md](API_CONTRACT.md) is the draft of the data shapes and endpoints this spec refers to. Yazmyrat, the data owner, approved the format in his review of PR #63. Baking Club (club 3) keeps its existing `Culinary arts` category.

**Where things stand:** the frontend works well but only on bundled sample files. The backend exists and gained event details and club filtering in #59, but it still serves different, smaller data. The two have never been connected. Most of the remaining work depends on connecting them, and that starts with agreeing on the contract.

### How to read this document

| Tag | Meaning |
|---|---|
| `[On main]` | Implemented on `main` today |
| `[In PR]` | In an open pull request, not on `main` |
| `[Proposed]` | A suggestion that the team has not approved |
| `[Undecided]` | No decision or proposal is settled |
| `[V1]` | Required for V1 by the confirmed V1 scope. Not necessarily built yet. |
| `[Post-V1]` | Deferred until after V1. Still a proposal. |

## 1. What ClubSync is

ClubSync is a CCNY campus events and clubs web app. Students browse events, discover and follow clubs, and see a personalized calendar. CCNY club events are currently scattered across flyers, emails, social media, and word of mouth, so ClubSync brings them into one place.

**Goal:** a finished, working, deployed product by the end of the semester, not a demo with hardcoded data. The exact deadline is not recorded in the repo and should be added here.

**Primary users:** CCNY students looking for club events.

**Name to settle:** the repo and backend say ClubSync, but the frontend is branded "Campus Groups · CCNY".

## 2. Tech stack and frameworks

### In use `[On main]`

| Area | Technology | Details |
|---|---|---|
| Frontend | Plain JavaScript modules, HTML, CSS | No UI framework. Hash-based routing. |
| Frontend build | Vite 7 | Requires Node 22.12+, 24, or 26+ |
| Frontend tests | Vitest 5 with V8 coverage | 7 tests in `frontend/tests/` |
| Backend | Python, Flask 3, Flask-Cors | Runs on port 5001 |
| Backend tests | Python `unittest` | 18 tests, including `tests/backend/` |
| CI | GitHub Actions | `tests.yml` runs backend tests with coverage on pull requests to `main` |

### Current vs. proposed

Items tagged `[V1]` are confirmed for V1. **The other proposals below are not approved.**

| Area | On `main` today | V1, proposed, or still undecided |
|---|---|---|
| Authentication | None. Sign-in and sign-up forms are previews that send and save nothing. One shared demo user. | `[V1]` One shared demo user, no tokens. `[Post-V1]` Real accounts with signup, login, salted password hashes, and bearer tokens. |
| Database storage | None. Clubs and events are in-memory records, and follows are in memory and lost on restart. | `[V1]` No database: JSON files for clubs and events, and in-memory follows that reset when the backend restarts. `[Post-V1]` Database choice is still open. `[Proposed]` Postgres with users, clubs, events, and follows tables. |
| Deployment | None. Everything runs locally, and `app.py` starts with `debug=True`. | `[V1]` Vercel for the frontend and Render for the backend. `[Post-V1]` Managed database provider, if a database is approved. |
| Event filtering | API: `club_id` only. Frontend: search, category, and club filters, in the browser on bundled data. | `[V1]` API keeps `club_id` only. `[Post-V1]` API `category`, `from`, and `to` filters. Not built. |
| Frontend CI | Not running. | `[In PR]` #53, changes requested. `[V1]` Becomes a required check once merged. |

## 3. Features

**Status key:** `[Done]` · `[In Progress]` · `[Not Started]`. These describe `main` only.

| Feature | Status | Frontend on `main` | Backend on `main` | Not yet on `main` |
|---|---|---|---|---|
| Events feed with search and category/club filtering | `[In Progress]` | Complete on bundled data | List endpoint and `club_id` filter work, on 3 in-memory events | Connection to the API. `[Post-V1]` API `category`, `from`, and `to` filters. |
| Weekly calendar view | `[In Progress]` | Complete on bundled data, opens on a sample week with a preview clock | Hides past events, which would empty earlier weeks | Connection to the API, and past events in the API (#57) |
| Club discovery and club pages | `[In Progress]` | Searchable directory works. No page for a single club. | 3 of 14 clubs. No single-club endpoint. | All 14 clubs (#57). `[Post-V1]` `GET /api/clubs/{id}` and a club page. |
| Event details view | `[In Progress]` | Detail dialog works on bundled data | `GET /api/events/{id}` works, on 3 in-memory events | Sample data format, and connection to the API |
| Follow / unfollow clubs | `[In Progress]` | No follow buttons | Works for clubs 1 to 3 only, in memory, for one demo user | All 14 clubs (#57), and follow buttons. `[Post-V1]` Per-user storage. |
| Personalized events and calendar for a logged-in user | `[In Progress]` | Not started (#58) | Demo-user endpoint only, on the old data shape. No logged-in users exist. | `start_time` support (#57), and the frontend view. `[Post-V1]` Real users. |
| Calendar export (.ics) | `[Done]` | Download works and is tested | None | `[Post-V1]` Optional backend version in #56, deferred. See section 6. |
| Authentication (sign-up, login, hashed passwords) | `[Not Started]` | Preview forms that send and save nothing | Nothing built | `[Post-V1]` See section 6. |

### Also tracked in FEATURES.md

| Feature | Status | Notes |
|---|---|---|
| Landing page and navigation | `[Done]` | Issue #7 is still open and could be reviewed for closing |
| Google Calendar integration | `[Not Started]` | `.ics` import may be enough. See section 6. |
| RSVP | `[Not Started]` | Proposed, not confirmed |

`FEATURES.md` was last updated on 2026-10-13 and is now out of date. For example, it lists the Events API as Planned.

### Tracking notes

- #57 is an issue, not a PR. It lists what the frontend needs from the backend, and the contract covers all of it.
- #57's checklist assigns work to `SShrestha57` and `sarindashrestha7-max`, but its assignees are `Yazmurat` and `sarindashrestha7-max`. The PM should confirm who owns the events and clubs work.

## 4. Architecture and components

### On `main` today: two disconnected halves

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

### Target: Phase 1 is `[V1]`, Phase 2 is `[Post-V1]`

The loaders are `[On main]` in `backend/services/sample_data.py` (#55), but no endpoint uses them yet. V1 hosting is Vercel and Render, which both serve over HTTPS. The database is post-V1.

```text
  Browser
    |
    v
  FRONTEND: pages -> services/data.js -> fetch
    |
    |  HTTPS + JSON, defined by docs/API_CONTRACT.md (draft)
    v
  BACKEND: api/ routes -> services/ business logic
    |
    +-- Phase 1: sample data loaders -> data/*.json
    |
    +-- Phase 2, post-V1, if approved: database (users, clubs, events, follows)
```

### Frontend components `[On main]`

| Path | Role |
|---|---|
| `src/main.js` | Hash router, event handling, detail dialog |
| `src/pages/home.js` | `#/` landing page |
| `src/pages/events.js` | `#/events` timeline with search, category, and club filters |
| `src/pages/clubs.js` | `#/clubs` searchable club directory |
| `src/pages/calendar.js` | `#/calendar` weekly calendar, day-grouped agenda on mobile |
| `src/pages/auth.js` | `#/signin` and `#/signup` preview forms |
| `src/components/ui.js` | Icons, tags, event cards, timeline, event detail |
| `src/services/data.js` | Data boundary. Imports the JSON today, and is where API calls would go. |
| `src/services/directory.js` | Joins, filters, New York dates, `.ics` generation, HTML escaping |
| `src/styles/main.css` | Design tokens and layouts |

### Backend routes `[On main]`

Verified by listing the routes of the running app at `5531d16`.

| Route | Function | File | Notes |
|---|---|---|---|
| `GET /` | `home` | `app.py` | Welcome message |
| `GET /api/health` | `health` | `app.py` | Health check |
| `GET /api/clubs` | `get_clubs` | `api/clubs.py` | 3 in-memory clubs |
| `POST /api/clubs/{id}/follow` | `follow_club_route` | `api/clubs.py` | Demo user, clubs 1 to 3 |
| `POST /api/clubs/{id}/unfollow` | `unfollow_club_route` | `api/clubs.py` | Demo user, clubs 1 to 3 |
| `GET /api/events` | `get_events` | `api/events.py` | 3 in-memory events, upcoming only. Supports `?club_id=`, with `400` for a non-integer value. |
| `GET /api/events/{id}` | `get_event_details` | `api/events.py` | 3 in-memory events. JSON `404` for an unknown ID. |
| `GET /api/events/personalized` | `get_personalized_events` | `api/events.py` | Demo user, upcoming only |

Demo user logic is in `services/demo_user.py`. `backend/models/` and `backend/integrations/` are empty.

### Data layer

| Source | Clubs | Events | Used by |
|---|---|---|---|
| `data/*.json` | 14 | 12, from November 16 to December 8, 2026 | Frontend |
| Python records in `backend/api/` | 3 | 3 | Backend |

The two sources disagree on more than size. Club 1 is Math Wizards in the JSON but Computer Science Club in the backend. Events use `start_time` and `end_time` in the JSON but `date` in the backend. `[V1]` The JSON shape is the single standard, with `category` values unchanged. `[Post-V1]` The draft contract also proposes changing 9 club `category` values. Club 3 (Baking club) keeps `Culinary arts`. That change has not been applied.

### Tests and coverage

| Suite | Result | Coverage |
|---|---|---|
| Frontend | 7 of 7 pass | 21.81% of lines overall. `directory.js` is at 87.8%. `main.js`, `ui.js`, `data.js`, and all pages are at 0%. |
| Backend | 18 of 18 pass | 77% in the CI run on #50: `app.py` 95%, `demo_user.py` 91%, `events.py` 77%, `clubs.py` 55%. |

Backend tests by file: `tests/test_backend_server.py` (9), `tests/backend/test_club_following.py` (4), `tests/backend/test_club_endpoints.py` (2), `tests/backend/test_sample_data.py` (2), and `tests/backend/test_startup.py` (1). CI now discovers `tests/backend/` and reports coverage on pull requests. Frontend tests do not run in CI until #53 merges.

### Pull requests

**Open**

| PR | What it does | Review state | Note |
|---|---|---|---|
| #56 | Backend `.ics` export | Changes requested | Conflicts with `main` |
| #53 | Frontend CI | Changes requested | Update from `main`, include `data/` changes |
| #61 | Event endpoint tests | Approved | Asserts `date` and hidden past events, which the draft contract proposes changing |

**Merged recently**

| PR | What it did |
|---|---|
| #50 | Backend startup test |
| #51 | Test discovery in subfolders |
| #54 | Backend coverage reporting in CI |
| #55 | Sample data loaders in `backend/services/sample_data.py`, with tests. Nothing on `main` uses them yet. |
| #59 | `GET /api/events/{id}` and the `club_id` filter |
| #60 | Club endpoint tests |
| #62 | Follow and unfollow tests |

## 5. What's still needed, by role

Owners come from the README and #57. Please correct anything that has changed. Items tagged `[Post-V1]` are not part of V1. Items tagged `[Proposed]` or `[Undecided]` depend on decisions in section 6 and should not start until those are made.

### Frontend (Denisa)

- [ ] Switch `services/data.js` from bundled JSON to the live API once it serves the agreed format
- [ ] Add loading and error states, since startup would then depend on a network request
- [ ] Remove the sample-week default and preview clock from the calendar once real data is live
- [ ] Add follow and unfollow buttons, keeping state across refresh through `GET /api/me` (#57)
- [ ] Build the personalized calendar and feed, with an empty state for no followed clubs (#58)
- [ ] Raise test coverage: `main.js`, `ui.js`, and all pages are at 0%
- [ ] `[V1]` Read the API address from `VITE_API_BASE_URL`
- [ ] `[Post-V1]` Build a single club page, with the club's info and events
- [ ] `[Post-V1]` Remove `categoryAliases`, if the club category migration is approved, except the `Culinary arts` entry that club 3 still needs
- [ ] `[Post-V1]` Connect the sign-up, sign-in, and sign-out flow, if real accounts are approved
- [ ] `[V1]` Keep the "Continue with Google" button preview-only. `[Post-V1]` Real Google sign-in, if approved

### Backend (Sangita, Sarinda, Yazmyrat)

**Requested in #57**

- [x] Add event details and the `club_id` filter (#59)
- [ ] Move routes off the in-memory records, using the loaders from #55 in `backend/services/sample_data.py`
- [ ] Serve all 14 clubs and 12 events in the sample data format, and keep past events
- [ ] Add `GET /api/me`, returning `id`, `name`, and `followed_clubs`
- [ ] Update `/api/events/personalized` to use `start_time` and include past events
- [ ] Accept all 14 clubs in follow and unfollow

**`[V1]` From the confirmed V1 scope**

- [ ] Sort events by start time
- [ ] Return JSON for all errors, including `500` when data cannot be loaded

**`[Post-V1]` From the draft contract**

- [ ] Add `category`, `from`, and `to` filters, including `category=All`
- [ ] Add `GET /api/clubs/{id}`

**`[Post-V1]` Real accounts and persistence, only if approved**

- [ ] Set up the database, models, and migrations in `backend/models/`
- [ ] Load clubs and events into the database from the JSON files, keeping the same IDs
- [ ] Add a users table, `POST /api/auth/signup`, and `POST /api/auth/login`, with salted password hashes
- [ ] Issue tokens and protect the follow, unfollow, personalized, and current-user endpoints
- [ ] Persist follows per user in the database, replacing `DEMO_USER`

**`[V1]` Ready for production on Render**

- [ ] Run under a production server such as Gunicorn. `app.py` currently starts with `debug=True`.
- [ ] Load secrets and database settings from environment variables, and add `.env.example`
- [ ] Restrict CORS to the deployed frontend's origin

### Data (Yazmyrat)

- [x] Review and confirm the event and club format in the draft contract (#27). Approved in the PR #63 review, with club 3 keeping `Culinary arts`.
- [x] Build the loaders, merged in #55 (#28)
- [ ] Validate clubs and events: required fields, valid times, and matching `club_id` values (#29)
- [ ] Resolve where real club and event data will come from, and who keeps it current (section 6)
- [ ] Extend or replace the sample schedule. Sample events end on December 8, 2026, so the app would show no upcoming events after that.
- [ ] `[Post-V1]` Migrate 9 club `category` values to the shared list, if confirmed. Club 3 keeps `Culinary arts` (see the contract, section 3.2)

### QA (Ayman)

- [x] Automate the startup test (#50) and test discovery in subfolders (#51)
- [x] Add club endpoint tests (#60) and follow and unfollow tests (#62)
- [ ] Finish event endpoint tests in #61 (#32), and update them if the event format changes
- [ ] Update `tests/test_backend_server.py` when the backend moves to the sample data format
- [ ] `[V1]` Add frontend and backend integration tests against a running API. Core features must be tested end to end before V1 is finished.
- [ ] Add UI tests for key flows: browse, filter, follow, personalized calendar, and `.ics` download
- [ ] Expand backend coverage from the current 77%, starting with `clubs.py` at 55%, and agree on a target with the team
- [ ] Complete the remaining checks: calendar (#34), and full demo (#35)
- [ ] Optional for V1: add contract tests that check every endpoint's response against the agreed schemas. V1 endpoints still need automated tests.

### PM / DevOps (Tanzina)

- [ ] Run the team's review of the draft contract and record each decision
- [x] Make sure Yazmyrat has confirmed the format before #27 is closed. He approved it in the PR #63 review.
- [ ] Confirm the owners of the events and clubs work in #57 (see the tracking notes in section 3)
- [ ] Assign owners for the single-club endpoint and error handling, and for the database and authentication if approved
- [x] Decide on the V1 hosts: Vercel for the frontend and Render for the backend. The database provider is post-V1.
- [ ] Make `frontend-tests` a required check after #53 merges (#48)
- [ ] Update `FEATURES.md` and the README's stack and setup sections
- [ ] Add the real deadline and project board link to the docs
- [ ] Prepare the final demo (#5)
- [ ] `[Post-V1]` Wire deployment into GitHub Actions, with production settings stored as secrets. V1 needs a working deployment, not an automated one.
- [ ] `[V1]` Once deployed, set up basic monitoring: health checks on `/api/health` and error logging

## 6. Key open decisions

"Proposal" is a starting point for discussion, not an approved direction. The last column records the V1 outcome confirmed by the PM on November 5, 2026 (see the contract's V1 scope). Decisions without a V1 outcome are still open.

| # | Decision | On `main` today | Proposal | Blocks | Needed by | V1 outcome |
|---|---|---|---|---|---|---|
| 1 | **API contract and data format (#27)** | Two different formats | Draft in `API_CONTRACT.md`. **Approved by Yazmyrat.** | **Almost everything:** #57, frontend integration, QA test updates | Now | Existing JSON fields and types, with categories unchanged. **Approved by Yazmyrat.** The post-V1 migration keeps club 3 as `Culinary arts`. |
| 2 | **Authentication: demo or real** | Demo user, no accounts | Real accounts, after demo-user work | Users table, sign-in UI, personalized view for real users | Now | Shared demo user. Real accounts are post-V1. |
| 3 | **Database** | None | Postgres | Models, real accounts, persistent follows | Before auth work starts | No database. Post-V1. |
| 4 | **Deployment platform** | None | None yet | CI deployment, production config, monitoring, and the managed database choice | Before auth work starts | Vercel and Render |
| 5 | Token or cookie sessions | None | Bearer tokens | Auth implementation | With decision 2 | Post-V1 |
| 6 | `.ics`: frontend only or also backend | Frontend only | Keep the frontend version, with the backend as optional | PR #56, #23 | Soon | Frontend only. Backend export is post-V1. |
| 7 | Source of real club and event data | Fictional sample files | None yet. Already an open question in `FEATURES.md`. | Moving beyond sample data, and the "not a demo" goal | Before final demo | Open |
| 8 | Can club officers post events? | No | None yet | Roles, and create and edit endpoints, which are not in the contract | Before final demo | Open |
| 9 | Scope of RSVP and Google integrations | Not built | Cut unless time remains | Only scope | Soon | Open |
| 10 | Product name | ClubSync and Campus Groups both used | None yet | Nothing technical | Before deployment | Open |

**Decision 1 and #27:** Yazmyrat, #27's assignee and the data owner, approved the club and event format in his review of this PR. Baking Club (club 3) keeps its existing `Culinary arts` category. The category migration remains post-V1.

## 7. Suggested sequence

`[Proposed]` A suggested order, not an approved plan. Step 8 is post-V1. Steps 6 and 9 use the V1 hosting decision: Vercel and Render.

1. **Agree on the contract.** Review `API_CONTRACT.md`, settle decisions 1 and 2, and get Yazmyrat's confirmation so #27 can close. Yazmyrat's confirmation is done.
2. **Clear the review queue.** #50, #51, #54, #55, #59, #60, and #62 are merged. Decide on #61 and #56, and finish #53.
3. **Make the data canonical.** Apply the confirmed format and add validation (#29).
4. **Serve the real data.** Move backend routes off the in-memory records, add the missing endpoints, and update the tests together (#57).
5. **Connect the frontend to the API.** Replace the bundled data in `services/data.js` (#3). This is the point where the project first works end to end.
6. **Deploy a first version** to Vercel and Render. An early deployment finds CORS and configuration problems while they are still small, and gives every later step a real environment to test in.
7. **Add follows and personalization for the demo user.** Follow buttons, club pages, and the personalized view (#58).
8. **`[Post-V1]` If approved, add the database, then real accounts.** Move data and follows into the database, then add sign-up, login, and protected endpoints, then the frontend sign-in flow.
9. **Finish production setup.** Restricted CORS, health checks, and error logging. `[Post-V1]` Automated deployment.
10. **Replace sample data and run the final test.** Bring in real or refreshed data, run the complete demo test (#35), and prepare the demo (#5).

**What can start in parallel now:** deployment setup, #53, #61, and frontend coverage work on `directory.js` and pages.
