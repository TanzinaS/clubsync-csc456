# ClubSync API Contract

**Status:** Draft for team review. Nothing here is binding until the team agrees on it. Agreement closes [#27](https://github.com/TanzinaS/clubsync-csc456/issues/27).

**Based on:** `main` at `6a92223`, open PRs #55, #56, and #59, and issue #57, as of 2026-11-05.

**Related:** [PROJECT_SPEC.md](PROJECT_SPEC.md) covers the wider project, roles, and sequence.

## 1. The rule this contract sets

**One event shape and one club shape, everywhere.** The rows in `data/sample_events.json` and `data/sample_clubs.json` are the wire format:

- The loaders from PR #55 return those rows unchanged.
- The API serves them unchanged.
- The frontend receives them unchanged, then computes any display-only values on its side (section 6).
- A future database stores the same fields under the same names.

This needs one data change: the `category` value of 10 clubs (section 3.2). No field is renamed, and `sample_events.json` does not change.

## 2. Conventions

| Topic | Rule |
|---|---|
| Base URL | Development: `http://127.0.0.1:5001`. The frontend reads it from `VITE_API_BASE_URL`. Production: decided with deployment. |
| Format | JSON, UTF-8. Request bodies need `Content-Type: application/json`. |
| Field names | `snake_case`, matching the sample data. |
| IDs | Positive integers. They stay stable when data moves to a database. |
| Timestamps | ISO 8601 with a UTC offset, such as `2026-11-16T13:00:00-05:00`. Compare them as instants, never as strings. |
| Calendar days | `YYYY-MM-DD`, always interpreted in `America/New_York`. This matches `dayKey()` in the frontend. |
| Lists | A bare JSON array. An empty result is `[]` with status `200`. No pagination for now. |
| Null and missing fields | Every field in section 3 is always present and never `null`. |
| Errors | Every error, including unknown routes and wrong methods, is JSON: `{ "error": "<message>" }`. |
| Authentication | `Authorization: Bearer <token>` on endpoints marked **Auth required** (see section 5 for the rollout). |

### Status codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Account created |
| `400` | Invalid parameter or request body |
| `401` | Token missing, invalid, or expired, or login failed |
| `404` | Resource or route not found |
| `405` | Method not allowed on this route |
| `409` | Email already registered |

## 3. Canonical schemas

### 3.1 Category

A closed list, taken from `CATEGORIES` in `frontend/src/services/directory.js`. Values are case-sensitive.

```text
"Tech" | "Cultural" | "Arts" | "Academic" | "Sports" | "Faith" | "Social" | "Community Service" | "Other"
```

### 3.2 Club

| Field | Type | Rules |
|---|---|---|
| `id` | integer | Unique |
| `name` | string | Non-empty, no leading or trailing spaces |
| `category` | Category | One value from section 3.1 |
| `description` | string | Non-empty |
| `contact_email` | string | Email address |

```json
{
  "id": 6,
  "name": "Robotics Club",
  "category": "Tech",
  "description": "We design, build, & program robots!",
  "contact_email": "contact@roboticsclub.example"
}
```

**Required data migration.** Ten clubs in `sample_clubs.json` use free-text categories that only work today because the frontend translates them. This change uses the frontend's existing alias table, so nothing changes on screen:

| Club IDs | Current value | Canonical value |
|---|---|---|
| 1 | Mathematics | Academic |
| 2 | Gaming | Tech |
| 3 | Culinary arts | Social |
| 4 | Media | Arts |
| 5 | Science | Academic |
| 6 | Engineering | Tech |
| 7 | Gardening | Community Service |
| 8 | Outdoor | Sports |
| 9 | Games | Social |
| 10 | Literature | Arts |

Clubs 11 to 14 already use canonical values.

### 3.3 Event

| Field | Type | Rules |
|---|---|---|
| `id` | integer | Unique |
| `club_id` | integer | Must match an existing club |
| `title` | string | Non-empty |
| `description` | string | Non-empty |
| `start_time` | string | Timestamp with offset |
| `end_time` | string | Timestamp with offset, later than `start_time` |
| `location` | string | Non-empty |
| `tags` | string[] | At least one item. `tags[0]` must be a Category and is the event's category. Any later items are free-form. |

```json
{
  "id": 3,
  "club_id": 6,
  "title": "Build Night: Line-Following Bots",
  "description": "Build a tiny robot with a big sense of direction. Work with a team to wire sensors & program a line-following bot. Materials provided; beginners welcome.",
  "start_time": "2026-11-17T14:00:00-05:00",
  "end_time": "2026-11-17T16:00:00-05:00",
  "location": "Marshak 418 · MakerLab",
  "tags": ["Tech"]
}
```

Notes:

- The `date` field in the current in-memory backend records is retired. Use `start_time`.
- An event's category can differ from its club's. Event 12 is `Cultural`, while its club, Page Turners, is `Arts`. Category filters on events use `tags[0]` only.
- A bad `club_id` or invalid times currently stop the whole frontend from loading, because `prepareDirectory()` throws. The backend must validate these rules (#29).

### 3.4 User

This extends the demo user that already exists, adding `email`. A password or password hash is never returned.

| Field | Type | Rules |
|---|---|---|
| `id` | integer | Unique |
| `name` | string | 1 to 100 characters |
| `email` | string | Unique, stored in lowercase |
| `followed_clubs` | integer[] | Club IDs with no duplicates. Order has no meaning. Empty when none are followed. |

```json
{
  "id": 1,
  "name": "Demo User",
  "email": "demo@clubsync.example",
  "followed_clubs": [6, 11]
}
```

### 3.5 AuthResponse

| Field | Type | Rules |
|---|---|---|
| `token` | string | Treat as opaque. Expires after 7 days. |
| `user` | User | The signed-in user |

## 4. Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/events` | No | List events, with filters |
| GET | `/api/events/{id}` | No | One event |
| GET | `/api/events/personalized` | **Yes** | Events from followed clubs |
| GET | `/api/events/{id}/calendar` | No | Download one event as `.ics` (optional, see 4.12) |
| GET | `/api/clubs` | No | List clubs, with filter |
| GET | `/api/clubs/{id}` | No | One club |
| POST | `/api/clubs/{id}/follow` | **Yes** | Follow a club |
| POST | `/api/clubs/{id}/unfollow` | **Yes** | Unfollow a club |
| POST | `/api/auth/signup` | No | Create an account |
| POST | `/api/auth/login` | No | Sign in |
| GET | `/api/me` | **Yes** | Current user, including `followed_clubs` |
| GET | `/api/health` | No | Health check (already live) |

### 4.1 GET /api/events

Returns all matching events, **including past ones**, because the calendar needs earlier weeks (#57). Sorted by `start_time` as an instant, then by `id`. The sample file is not fully in time order (event 12 starts before event 11), so the backend must sort.

| Query param | Type | Required | Behavior |
|---|---|---|---|
| `club_id` | integer | No | Events from this club. An unknown club returns `[]`. |
| `category` | Category | No | Events where `tags[0]` equals this value. |
| `from` | `YYYY-MM-DD` | No | Events starting on or after this New York day. |
| `to` | `YYYY-MM-DD` | No | Events starting on or before this New York day. |

Filters combine with AND. The frontend omits a param to mean "all", so it must not send its UI values `All` or `all`. Text search stays client-side for now, because `filterEvents()` already covers it. For an upcoming-only view, send `from=<today>`.

Example: `GET /api/events?club_id=6&category=Tech`

**200**

```json
[
  {
    "id": 3,
    "club_id": 6,
    "title": "Build Night: Line-Following Bots",
    "description": "Build a tiny robot with a big sense of direction. Work with a team to wire sensors & program a line-following bot. Materials provided; beginners welcome.",
    "start_time": "2026-11-17T14:00:00-05:00",
    "end_time": "2026-11-17T16:00:00-05:00",
    "location": "Marshak 418 · MakerLab",
    "tags": ["Tech"]
  }
]
```

| Status | Body | When |
|---|---|---|
| `400` | `{ "error": "Invalid club_id" }` | `club_id` is not an integer |
| `400` | `{ "error": "Invalid category" }` | `category` is not in section 3.1 |
| `400` | `{ "error": "Invalid date" }` | `from` or `to` is badly formatted |
| `400` | `{ "error": "Invalid date range" }` | `from` is later than `to` |

### 4.2 GET /api/events/{id}

**200:** one Event (section 3.3). The club is not embedded. Join on `club_id`, or call `GET /api/clubs/{id}`.

| Status | Body | When |
|---|---|---|
| `404` | `{ "error": "Event not found" }` | No event has this ID |
| `404` | `{ "error": "Not found" }` | The ID is not an integer |

### 4.3 GET /api/events/personalized

**Auth required.** Returns events from the clubs the current user follows, in the same order and shape as `GET /api/events`.

| Query param | Type | Required | Behavior |
|---|---|---|---|
| `category` | Category | No | Same as `GET /api/events` |
| `from` | `YYYY-MM-DD` | No | Same as `GET /api/events` |
| `to` | `YYYY-MM-DD` | No | Same as `GET /api/events` |

**200:** `Event[]`. Returns `[]` if the user follows nothing, so the frontend can show its empty state (#58).

| Status | Body | When |
|---|---|---|
| `400` | Same as `GET /api/events` | Invalid param |
| `401` | `{ "error": "Authentication required" }` | Token missing, invalid, or expired |

### 4.4 GET /api/clubs

Returns all matching clubs, sorted by `id`.

| Query param | Type | Required | Behavior |
|---|---|---|---|
| `category` | Category | No | Clubs with this category |

**200**

```json
[
  {
    "id": 6,
    "name": "Robotics Club",
    "category": "Tech",
    "description": "We design, build, & program robots!",
    "contact_email": "contact@roboticsclub.example"
  }
]
```

| Status | Body | When |
|---|---|---|
| `400` | `{ "error": "Invalid category" }` | `category` is not in section 3.1 |

### 4.5 GET /api/clubs/{id}

**200:** one Club (section 3.2). A club page gets its events from `GET /api/events?club_id={id}`.

| Status | Body | When |
|---|---|---|
| `404` | `{ "error": "Club not found" }` | No club has this ID |
| `404` | `{ "error": "Not found" }` | The ID is not an integer |

### 4.6 POST /api/clubs/{id}/follow

**Auth required.** No request body. Safe to repeat: following a club twice does not create a duplicate.

**200:** the updated User (section 3.4).

| Status | Body | When |
|---|---|---|
| `401` | `{ "error": "Authentication required" }` | Token missing, invalid, or expired |
| `404` | `{ "error": "Club not found" }` | No club has this ID |

### 4.7 POST /api/clubs/{id}/unfollow

**Auth required.** No request body. Safe to repeat: unfollowing a club the user does not follow still returns `200`.

**200:** the updated User. Errors match section 4.6.

### 4.8 POST /api/auth/signup

The fields match the existing sign-up form in `frontend/src/pages/auth.js`.

**Request**

| Field | Type | Rules |
|---|---|---|
| `name` | string | 1 to 100 characters after trimming |
| `email` | string | Valid email. Stored in lowercase. |
| `password` | string | 8 to 128 characters. Stored only as a salted hash. |

```json
{
  "name": "Sample Student",
  "email": "student@example.com",
  "password": "example-password"
}
```

**201:** AuthResponse

```json
{
  "token": "<opaque token>",
  "user": {
    "id": 2,
    "name": "Sample Student",
    "email": "student@example.com",
    "followed_clubs": []
  }
}
```

| Status | Body | When |
|---|---|---|
| `400` | `{ "error": "Invalid name" }` | Name missing or invalid |
| `400` | `{ "error": "Invalid email" }` | Email missing or invalid |
| `400` | `{ "error": "Invalid password" }` | Password missing or wrong length |
| `409` | `{ "error": "Email already registered" }` | Email already in use |

### 4.9 POST /api/auth/login

**Request**

```json
{
  "email": "student@example.com",
  "password": "example-password"
}
```

**200:** AuthResponse (section 3.5).

| Status | Body | When |
|---|---|---|
| `400` | `{ "error": "Email and password are required" }` | A field is missing |
| `401` | `{ "error": "Invalid email or password" }` | Same message for an unknown email or a wrong password, so accounts cannot be discovered through login |

**Logging out** needs no endpoint: the frontend deletes its token.

### 4.10 GET /api/me

**Auth required.** Lets followed clubs survive a page refresh (#57, #58).

**200:** User (section 3.4).

| Status | Body | When |
|---|---|---|
| `401` | `{ "error": "Authentication required" }` | Token missing, invalid, or expired |

### 4.11 GET /api/health

**200:** `{ "status": "ok", "service": "ClubSync Backend" }`. Already live; no change needed.

### 4.12 GET /api/events/{id}/calendar (optional)

Tracked by #23 and PR #56. **200** returns `text/calendar` with `Content-Disposition: attachment; filename="event_{id}.ics"`. **404** returns `{ "error": "Event not found" }`.

The frontend already generates `.ics` files itself with `calendarFile()`, so the team needs to decide whether this endpoint is still wanted (section 7, decision 6).

## 5. Rollout: demo user first, real accounts second

Both phases use the same paths and the same response shapes, so frontend work done in Phase 1 carries over.

| | Phase 1: demo user | Phase 2: real accounts |
|---|---|---|
| Who the user is | Single shared demo user | User identified by the token |
| Auth-required endpoints | Work with no token | Return `401` without a valid token |
| `/api/auth/*` | Not available yet | Live |
| Where follows are stored | Memory, lost on restart and shared by all visitors | Database |

**Frontend change needed to move from Phase 1 to Phase 2:** add the sign-in flow and send the token on auth-required requests.

## 6. What stays on the frontend

The API never sends these. `prepareDirectory()` computes them after loading the data:

| Value | Source |
|---|---|
| `event.club` | The club whose `id` equals `event.club_id` |
| `event.category` | `event.tags[0]` |

Also client-side: text search, week grouping, date formatting, and the `club` filter name in `#/events?club=6`. That is a page URL, separate from the API's `club_id` param.

## 7. Decisions for the team to approve

These are the choices this draft makes where the repo did not already settle them.

| # | Decision | Proposed | Why | Main alternative |
|---|---|---|---|---|
| 1 | Category values | Migrate the 10 club values to the closed list | One set of values, and no translation layer on either side | Keep free-text values and copy the alias table into the backend |
| 2 | Past events | `/api/events` includes them; `from` and `to` narrow the range | The calendar needs earlier weeks, and #57 asks for this | Upcoming only by default. Breaks the calendar's earlier weeks. |
| 3 | Event response | Flat, joined by `club_id` | Matches the file exactly | Embed `club`. This creates a second event shape. |
| 4 | Token transport | Bearer token in the `Authorization` header | Works across origins whichever hosts are chosen, with no cookie or CSRF setup | HttpOnly session cookie. Safer against XSS, but needs same-site hosting or cross-site cookie and CSRF setup. |
| 5 | Follow routes | Keep `POST .../follow` and `POST .../unfollow` | Already merged and tested | `POST` and `DELETE` on one route. More conventional, but requires a rewrite. |
| 6 | `.ics` export | Keep `calendarFile()` for the current button, and treat the backend endpoint as optional | The frontend version already works and folds long lines | Merge #56 and switch the button to the API |
| 7 | Sign-up restriction | Any valid email | Keeps testing and demos simple | CCNY email addresses only |

## 8. Gap checklist: contract vs. what the backend serves today

Checked by running the app on `main`. Owners follow #57 where it assigns them; the others are suggestions.

### Data

- [ ] Migrate the 10 club `category` values (section 3.2). *Data*
- [ ] Finish and merge the loaders, PR #55. Review asks to move them to `backend/services/` and add tests. *Yazmyrat*
- [ ] Validate clubs and events against this contract, #29. *Data, QA*

### Events

- [ ] `GET /api/events` serves all 12 events from the loaders. Today: 3 in-memory events with `date` and no `start_time`, `end_time`, or `tags`. *SShrestha57*
- [ ] Stop hiding past events by default. *SShrestha57*
- [ ] Add `club_id` filtering. In PR #59, not on `main`. Today the param is silently ignored. *SShrestha57*
- [ ] Add `category`, `from`, and `to` filtering. Not started. Today `category` is silently ignored. *SShrestha57*
- [ ] Sort events by `start_time` as an instant. *SShrestha57*
- [ ] Add `GET /api/events/{id}`. In PR #59, not on `main`, and needs moving to the loaders. *SShrestha57*
- [ ] Make `/api/events/personalized` use `start_time`, the loaders, and the new filters. *sarindashrestha7-max*
- [ ] Decide on `GET /api/events/{id}/calendar`. PR #56 has changes requested and conflicts with #59. *sarindashrestha7-max*

### Clubs

- [ ] `GET /api/clubs` serves all 14 clubs from the loaders. Today: 3 in-memory clubs with no `category` or `contact_email`. *SShrestha57*
- [ ] Add `category` filtering. *SShrestha57*
- [ ] Add `GET /api/clubs/{id}`. Missing today. *Backend*
- [ ] Make follow and unfollow accept all 14 clubs. Today: anything other than clubs 1 to 3 returns `404`. *sarindashrestha7-max*

### Users and follows

- [ ] Add `GET /api/me`. Missing today. *sarindashrestha7-max*
- [ ] Add `email` to the user response. *Backend*
- [ ] Choose and connect a database, with `users`, `clubs`, `events`, and `follows` tables. Today there is none. *Backend*
- [ ] Persist follows per user. Today they live in `DEMO_USER`, in memory, shared by everyone, and lost on restart. *Backend*

### Authentication

- [ ] Add `POST /api/auth/signup` with salted password hashing. Missing today. *Backend*
- [ ] Add `POST /api/auth/login` and token issuing. Missing today. *Backend*
- [ ] Require a valid token on follow, unfollow, personalized, and me (Phase 2). Today nothing is protected. *Backend*
- [ ] Load `SECRET_KEY` and other secrets from the environment. *Backend, DevOps*

### Across the API

- [ ] Return JSON for all errors. Today unknown routes (`404`) and wrong methods (`405`) return HTML. *Backend*
- [ ] Restrict CORS to the frontend's origin in production. Today `CORS(app)` allows every origin. *Backend, DevOps*

### Tests to update when the shapes change

- [ ] `tests/test_backend_server.py` expects 3 clubs and 3 events with old titles. Those IDs also change meaning: club 1 is Computer Science Club in memory but Math Wizards in the JSON. *Backend, QA*
- [ ] PR #59's new tests assert the `date` field and old titles. *SShrestha57*
- [ ] PR #61 asserts `date` and that past events are hidden, which this contract reverses. *QA*
- [ ] Add contract tests that check each endpoint's response against section 3. *QA*

### Frontend (once the API matches)

- [ ] Make `frontend/src/services/data.js` load from the API. It imports the JSON at build time and `calendar.js` reads `events` on import, so startup must wait for data and handle a failed request. *Denisa*
- [ ] Remove `categoryAliases` after the data migration. *Denisa*
- [ ] Add follow buttons, the personalized view, club pages, and the real sign-in flow. *Denisa*
