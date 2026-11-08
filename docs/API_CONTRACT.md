# ClubSync API Contract

**Status:** Draft for team review. The [V1 scope](#v1-scope--confirmed-pm-decisions-november-5-2026) was confirmed by the PM on November 5, 2026. Anything outside it is not approved yet.

**Issue #27:** Yazmyrat, the data owner and [#27](https://github.com/TanzinaS/clubsync-csc456/issues/27)'s assignee, approved this format in his review of this PR, with one clarification: Baking Club (club 3) keeps its existing `Culinary arts` category (section 3.2).

**Based on:** `main` at `5531d16`, open PRs, and issues, as of 2026-11-05.

**Related:** [PROJECT_SPEC.md](PROJECT_SPEC.md) covers the wider project, roles, and sequence.

## How to read this document

| Tag | Meaning |
|---|---|
| `[On main]` | Implemented and served on `main` today |
| `[Partial]` | The route exists on `main`, but its behavior or data differs from this draft |
| `[Proposed]` | Not built and not approved |
| `[Pending]` | Depends on an open PR or an undecided implementation detail |
| `[V1]` | Required for V1 by the confirmed V1 scope. Not necessarily built yet. |
| `[Post-V1]` | Deferred until after V1. Still a proposal. |

Anything without a tag describes the proposed contract, not what `main` does today. Where it differs from the V1 scope below, the V1 scope wins.

## V1 Scope — Confirmed PM Decisions (November 5, 2026)

These decisions set the scope of V1, the first working, deployed release. They are confirmed by the PM. `[V1]` marks what they require; it does not mean the item is built. **Where any other section of this document differs, this section wins for V1.** Everything tagged `[Post-V1]` stays a proposal for after the release.

**Format approved:** Yazmyrat approved the club and event format for #27 in his review of this PR. Baking Club (club 3) keeps its existing `Culinary arts` category.

**Authentication**
- One shared demo user. No login tokens or real authentication.
- The sign-in and sign-up screens, including "Continue with Google", stay preview-only.
- Registration, login, and Google sign-in are post-V1.

**Data**
- The V1 schema is the existing fields and types in `data/sample_clubs.json` and `data/sample_events.json` (sections 3.2 and 3.3).
- Club `category` values stay unchanged. The frontend keeps mapping them to display categories with `categoryAliases`. No category migration for V1.
- Events are flat JSON records linked to clubs by `club_id`. The club object is not embedded.
- The shared backend loaders in `backend/services/sample_data.py` (#55) become the single source of club and event data, replacing the in-memory records.

**Events**
- `GET /api/events` returns all events, including past events, sorted by `start_time` as an instant, then by `id`.
- The existing `club_id` filter stays.
- The `category`, `from`, and `to` query filters are post-V1. The V1 frontend must not send them. The backend may currently ignore them, but that behavior is not part of the V1 contract.
- `GET /api/events/personalized` uses the same event data and rules, including past events, restricted to followed clubs.

**Demo user**
- Implement `GET /api/me`. The V1 response contains `id`, `name`, and `followed_clubs`.
- Follow and unfollow keep the existing paths, `POST /api/clubs/{id}/follow` and `POST /api/clubs/{id}/unfollow`, and work with all 14 shared clubs.
- The frontend gets the current followed clubs from the backend.

**Storage**
- JSON files for clubs and events, and in-memory follows for the demo user. No database.
- Follows reset when the backend restarts.

**API errors**
- Consistent JSON errors for invalid requests and missing resources, as in section 2, including JSON `404` and `405` responses.
- A clear JSON `500` error when data cannot be loaded: `{ "error": "Data unavailable" }`.

**Calendar**
- Keep the existing frontend `.ics` export (`calendarFile()`). Backend calendar export (#56, #23) is deferred.

**Deployment**
- Vercel for the frontend and Render for the Flask backend.
- The frontend reads the backend URL from `VITE_API_BASE_URL`.
- Production CORS allows the deployed frontend's origin instead of every origin.
- V1 needs a working deployed website. Deployment does not need to be automated.

**Monitoring**
- A basic health check on `/api/health` and error logging are enough for V1.

**Testing**
- Backend CI stays a required check.
- Frontend CI becomes a required check after PR #53 is fixed and merged.
- V1 endpoints must have appropriate automated tests. Dedicated contract-testing infrastructure is optional.
- V1 is not finished until the core features are tested end to end.

**Post-V1**
- Real authentication (sections 3.5, 4.8, and 4.9).
- Database persistence.
- Backend `category` and `from`/`to` filters.
- `GET /api/clubs/{id}`.
- Backend calendar export.
- Automated deployment.
- Other features not needed for the first working release.

## 1. The rule this contract proposes

`[V1]` **One event shape and one club shape, everywhere.** The rows in `data/sample_events.json` and `data/sample_clubs.json` would become the wire format:

- The API serves those rows unchanged.
- The frontend receives them unchanged, then computes any display-only values on its side (section 6).
- A future database, if approved, stores the same fields under the same names.

V1 needs no data change: no field is renamed, and neither file changes. `[Post-V1]` A proposed migration would change the `category` value of 9 clubs (section 3.2).

**Today:** the frontend reads the JSON files directly, while the API serves 3 clubs and 3 events from separate in-memory records in a different shape.

## 2. Conventions

These are proposed for the whole API unless a row is tagged otherwise.

| Topic | Rule |
|---|---|
| Base URL | `[On main]` Development: `http://127.0.0.1:5001`. `[V1]` The frontend reads it from `VITE_API_BASE_URL`. Production: the Render backend URL. |
| Format | JSON, UTF-8. Request bodies need `Content-Type: application/json`. |
| Field names | `snake_case`, matching the sample data. |
| IDs | Positive integers. They stay stable if data moves to a database. |
| Timestamps | ISO 8601 with a UTC offset, such as `2026-11-16T13:00:00-05:00`. Compare them as instants, never as strings. |
| Calendar days | `YYYY-MM-DD`, always interpreted in `America/New_York`. This matches `dayKey()` in the frontend. |
| Lists | `[On main]` A bare JSON array. An empty result is `[]` with status `200`. No pagination for now. |
| Null and missing fields | Every field in section 3 is always present and never `null`. |
| Errors | Every error, including unknown routes and wrong methods, is JSON: `{ "error": "<message>" }`. |
| Authentication | `[V1]` No token. Every endpoint works without one. `[Post-V1]` `Authorization: Bearer <token>` on endpoints marked **Auth required**, if real accounts are approved (see section 5). |

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
| `500` | Data could not be loaded, or another server failure |

### Common error responses

These apply to every endpoint where the case can occur. **`[V1]` This table is the V1 error format. It is not a description of current behavior.** Only rows tagged `[On main]` fully match what `main` returns today. `[Partial]` means the status code already matches, but the JSON body is proposed.

| Case | Example | Status | Proposed body | On `main` today |
|---|---|---|---|---|
| Non-integer ID in the path | `GET /api/clubs/abc`, `POST /api/clubs/abc/follow`, `GET /api/events/abc` | `404` | `{ "error": "Not found" }` | `[Partial]` Returns `404` with an HTML body |
| Non-integer `club_id` in the query | `GET /api/events?club_id=abc` | `400` | `{ "error": "Invalid club_id" }` | `[On main]` |
| Integer ID with no matching club | `POST /api/clubs/999/follow` | `404` | `{ "error": "Club not found" }` | `[On main]` |
| Integer ID with no matching event | `GET /api/events/999` | `404` | `{ "error": "Event not found" }` | `[On main]` |
| Data cannot be loaded, such as a loader raising an error or an unreachable database | Any endpoint that reads clubs or events | `500` | `{ "error": "Data unavailable" }` | Not on `main`. Cannot occur yet, because data is in memory |
| Any other unexpected server failure | Any endpoint | `500` | `{ "error": "Internal server error" }` | Not on `main`. Flask's default HTML `500` today |
| Unknown route | `GET /api/does-not-exist` | `404` | `{ "error": "Not found" }` | `[Partial]` Returns `404` with an HTML body |
| Wrong method | `DELETE /api/clubs/1/follow` | `405` | `{ "error": "Method not allowed" }` | `[Partial]` Returns `405` with an HTML body |

Non-integer path IDs return `404` because Flask's `<int:...>` routes do not match them, so the request never reaches the endpoint.

`500` responses must not include file paths, stack traces, or exception text. The backend logs those details instead, and the frontend shows an error state.

## 3. Canonical schemas

### 3.1 Category

`[Post-V1]` As a rule for club data: a closed list, taken from `CATEGORIES` in `frontend/src/services/directory.js`. Values are case-sensitive. In V1, event `tags[0]` values already follow it, club `category` values stay unchanged, and the frontend maps them to this list for display. Exception: club 3 keeps `Culinary arts` under the post-V1 proposal (section 3.2), which is not on this list.

```text
"Tech" | "Cultural" | "Arts" | "Academic" | "Sports" | "Faith" | "Social" | "Community Service" | "Other"
```

**Today:** the frontend uses this list for display. The event `tags` in `sample_events.json` already follow it, but only 4 of the 14 clubs do. The API has no category data.

`All` is not a category. It is a frontend "no filter" selection, handled as described in sections 4.1 and 4.4.

### 3.2 Club

| Field | Type | Rules |
|---|---|---|
| `id` | integer | Unique |
| `name` | string | Non-empty, no leading or trailing spaces |
| `category` | string | `[V1]` Non-empty. The value in `sample_clubs.json`, unchanged. `[Post-V1]` One value from section 3.1, if the migration is approved, except club 3, which keeps `Culinary arts`. |
| `description` | string | Non-empty |
| `contact_email` | string | Email address |

**Today:** these five fields exist in `sample_clubs.json`. The API's in-memory clubs have only `id`, `name`, and `description`.

> **Post-V1 example, not the V1 response:** `category` below is `"Tech"` after the proposed migration. In V1 the API returns `"Engineering"`, the value in `sample_clubs.json`.

```json
{
  "id": 6,
  "name": "Robotics Club",
  "category": "Tech",
  "description": "We design, build, & program robots!",
  "contact_email": "contact@roboticsclub.example"
}
```

**`[Post-V1]` data migration, not applied and not part of V1.** Ten clubs in `sample_clubs.json` use free-text categories that only work today because the frontend translates them. The proposal changes 9 of them, using the frontend's existing alias table, so nothing would change on screen. Club 3 (Baking club) keeps `Culinary arts`, as Yazmyrat asked in review. Yazmyrat approved the other 9 changes, but the migration stays post-V1 and is not applied (section 7, decision 1).

| Club IDs | Value in the file today | Proposed value |
|---|---|---|
| 1 | Mathematics | Academic |
| 2 | Gaming | Tech |
| 3 | Culinary arts | Culinary arts (unchanged) |
| 4 | Media | Arts |
| 5 | Science | Academic |
| 6 | Engineering | Tech |
| 7 | Gardening | Community Service |
| 8 | Outdoor | Sports |
| 9 | Games | Social |
| 10 | Literature | Arts |

Clubs 11 to 14 already use values from the list.

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

**Today:** these fields exist in `sample_events.json`, and this example is an unchanged row from that file. The API's in-memory events instead have `id`, `club_id`, `title`, `date`, `location`, and `description`.

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

- `[V1]` The `date` field in the in-memory backend records is retired in favor of `start_time`.
- An event's category can differ from its club's. Event 12 is `Cultural`, while its club, Page Turners, would be `Arts` under the proposed migration (`Literature` in the file today). Category filters on events use `tags[0]` only.
- A bad `club_id` or invalid times currently stop the whole frontend from loading, because `prepareDirectory()` throws. The backend must validate these rules (#29).

### 3.4 User

`[Partial]` The demo user on `main` has `id`, `name`, and `followed_clubs`. `[V1]` The V1 response has exactly these three fields. `[Post-V1]` This adds `email`. A password or password hash is never returned.

| Field | Type | Rules |
|---|---|---|
| `id` | integer | Unique |
| `name` | string | 1 to 100 characters |
| `email` | string | `[Post-V1]` Unique, stored in lowercase |
| `followed_clubs` | integer[] | Club IDs with no duplicates. Order has no meaning. Empty when none are followed. |

> **Post-V1 example, not the V1 response:** `email` is not part of V1, and `main` only accepts follows for clubs 1 to 3 today.

```json
{
  "id": 1,
  "name": "Demo User",
  "email": "demo@clubsync.example",
  "followed_clubs": [6, 11]
}
```

### 3.5 AuthResponse

`[Post-V1]` Applies only if real accounts and bearer tokens are approved.

| Field | Type | Rules |
|---|---|---|
| `token` | string | Treat as opaque. Expires after 7 days. |
| `user` | User | The signed-in user |

## 4. Endpoints

"Auth" describes the proposed post-V1 rule. **No endpoint on `main` requires authentication today, and none does in V1.**

| Method | Path | Auth | On `main` today |
|---|---|---|---|
| GET | `/api/events` | No | `[Partial]` 3 in-memory events, upcoming only, `club_id` filter works |
| GET | `/api/events/{id}` | No | `[Partial]` Works, on the 3 in-memory events |
| GET | `/api/events/personalized` | **Yes** | `[Partial]` Demo user, old shape, upcoming only |
| GET | `/api/events/{id}/calendar` | No | `[Post-V1]` Deferred, in PR #56 (see 4.12) |
| GET | `/api/clubs` | No | `[Partial]` 3 in-memory clubs, no filter |
| GET | `/api/clubs/{id}` | No | `[Post-V1]` Missing |
| POST | `/api/clubs/{id}/follow` | **Yes** | `[Partial]` Demo user, clubs 1 to 3 only |
| POST | `/api/clubs/{id}/unfollow` | **Yes** | `[Partial]` Demo user, clubs 1 to 3 only |
| POST | `/api/auth/signup` | No | `[Post-V1]` Missing |
| POST | `/api/auth/login` | No | `[Post-V1]` Missing |
| GET | `/api/me` | **Yes** | `[V1]` Missing |
| GET | `/api/health` | No | `[On main]` |

### 4.1 GET /api/events

**On `main` today:** returns the 3 in-memory events dated today or later, in the old shape. `club_id` works. `category`, `from`, and `to` are silently ignored.

**`[V1]`:** returns all matching events, **including past ones**, because the calendar needs earlier weeks (#57). Sorted by `start_time` as an instant, then by `id`. The sample file is not fully in time order (event 12 starts before event 11), so the backend must sort.

| Query param | Type | Required | Status | Behavior |
|---|---|---|---|---|
| `club_id` | integer | No | `[On main]` | Events from this club. An unknown club returns `[]`. |
| `category` | Category or `All` | No | `[Post-V1]` | Events where `tags[0]` equals this value. `All` means no filter. |
| `from` | `YYYY-MM-DD` | No | `[Post-V1]` | Events starting on or after this New York day. |
| `to` | `YYYY-MM-DD` | No | `[Post-V1]` | Events starting on or before this New York day. |

Filters combine with AND. The frontend should omit a param to mean "all". `[Post-V1]` Once the `category` filter exists, the backend treats `category=All` as no filter, as in section 4.4. The frontend's `club` value `all` must never be sent, because `club_id=all` returns `400`. Text search stays client-side for now, because `filterEvents()` already covers it. In V1, the frontend handles upcoming-only views itself and does not send `category`, `from`, or `to`. `[Post-V1]` It can send `from=<today>` instead.

Example: `GET /api/events?club_id=6&category=Tech`

`[Post-V1]` example, because it uses the `category` filter. In V1, `GET /api/events?club_id=6` returns this same event. Neither is served by `main` today.

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

| Status | Body | When | On `main` today |
|---|---|---|---|
| `400` | `{ "error": "Invalid club_id" }` | `club_id` is not an integer | `[On main]` |
| `400` | `{ "error": "Invalid category" }` | `category` is not in section 3.1 and is not `All` | `[Post-V1]` |
| `400` | `{ "error": "Invalid date" }` | `from` or `to` is badly formatted | `[Post-V1]` |
| `400` | `{ "error": "Invalid date range" }` | `from` is later than `to` | `[Post-V1]` |

### 4.2 GET /api/events/{id}

**On `main` today:** works for the 3 in-memory events, in the old shape with `date`.

**`[V1]`:** **200** returns one Event (section 3.3). The club is not embedded. Join on `club_id`, or, post-V1, call `GET /api/clubs/{id}`.

| Status | Body | When | On `main` today |
|---|---|---|---|
| `404` | `{ "error": "Event not found" }` | No event has this ID | `[On main]` |
| `404` | `{ "error": "Not found" }` | The ID is not an integer | `[Partial]` Returns `404`. JSON body is proposed; it is HTML today. |

### 4.3 GET /api/events/personalized

**On `main` today:** returns upcoming in-memory events for the shared demo user's followed clubs. No token is needed, and no query params are read.

**`[V1]`:** no token, using the shared demo user. Returns every event from the clubs the user follows, **including past ones**, from the same data and in the same order and shape as `GET /api/events`.

**`[Post-V1]`:** **Auth required** if real accounts are approved.

| Query param | Type | Required | Status | Behavior |
|---|---|---|---|---|
| `category` | Category or `All` | No | `[Post-V1]` | Same as `GET /api/events` |
| `from` | `YYYY-MM-DD` | No | `[Post-V1]` | Same as `GET /api/events` |
| `to` | `YYYY-MM-DD` | No | `[Post-V1]` | Same as `GET /api/events` |

**200:** `Event[]`. Returns `[]` if the user follows nothing, so the frontend can show its empty state (#58).

| Status | Body | When |
|---|---|---|
| `400` | Same as `GET /api/events` | `[Post-V1]` Invalid param. This endpoint reads no params today. |
| `401` | `{ "error": "Authentication required" }` | `[Post-V1]` Token missing, invalid, or expired |

### 4.4 GET /api/clubs

**On `main` today:** returns all 3 in-memory clubs. Query params are ignored, so `?category=All` also returns all 3.

**`[V1]`:** returns all 14 clubs from the shared data, sorted by `id`, with `category` values unchanged.

| Query param | Type | Required | Status | Behavior |
|---|---|---|---|---|
| `category` | Category or `All` | No | `[Post-V1]` | Clubs with this category. `All` means no filter. |

**`[Post-V1]` Handling `All`, once the `category` filter exists:**

- `GET /api/clubs?category=All` must return every club, exactly like `GET /api/clubs`. It is not an error.
- The frontend's club filter has an "All categories" option whose value is `All`. Once the frontend calls the API, it should omit `category` for that option. The backend must still handle `All` correctly if it is sent.
- Matching is case-sensitive, so `all` returns `400`, like any other value outside the list.

> **Post-V1 example, not the V1 response:** `category` below is `"Tech"` after the proposed migration. In V1 the API returns `"Engineering"`, the value in `sample_clubs.json`. A `category=Tech` filter would not return this club against today's file.

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

These errors are not current behavior. `main` ignores `category` today and cannot hit a data-loading failure.

| Status | Proposed body | When |
|---|---|---|
| `400` | `{ "error": "Invalid category" }` | `[Post-V1]` `category` is not in section 3.1 and is not `All` |
| `500` | `{ "error": "Data unavailable" }` | `[V1]` Club data cannot be loaded |

### 4.5 GET /api/clubs/{id}

**On `main` today:** this route does not exist. Every request returns an HTML `404`.

**`[Post-V1]`:** **200** returns one Club (section 3.2). A club page gets its events from `GET /api/events?club_id={id}`.

`[Post-V1]` These errors are not current behavior.

| Status | Proposed body | When |
|---|---|---|
| `404` | `{ "error": "Club not found" }` | No club has this ID |
| `404` | `{ "error": "Not found" }` | The ID is not an integer, such as `/api/clubs/abc` |
| `500` | `{ "error": "Data unavailable" }` | Club data cannot be loaded |

### 4.6 POST /api/clubs/{id}/follow

**On `main` today:** works without a token for one shared demo user, and only for clubs 1 to 3. Follows are lost on restart.

**`[V1]`:** no token, using the shared demo user. Works for all 14 shared clubs. No request body. Safe to repeat: following a club twice does not create a duplicate.

**`[Post-V1]`:** **Auth required** if real accounts are approved.

**200:** the updated User (section 3.4).

| Status | Body | When | On `main` today |
|---|---|---|---|
| `401` | `{ "error": "Authentication required" }` | Token missing, invalid, or expired | `[Post-V1]` |
| `404` | `{ "error": "Club not found" }` | No club has this ID | `[On main]` |
| `404` | `{ "error": "Not found" }` | The ID is not an integer | `[Partial]` Returns `404`. JSON body is proposed; it is HTML today. |

### 4.7 POST /api/clubs/{id}/unfollow

**On `main` today:** same limits as follow.

**`[V1]`:** no token, using the shared demo user. Works for all 14 shared clubs. No request body. Safe to repeat: unfollowing a club the user does not follow still returns `200`.

**`[Post-V1]`:** **Auth required** if real accounts are approved.

**200:** the updated User. Errors match section 4.6.

### 4.8 POST /api/auth/signup

`[Post-V1]` **Not built, and not part of V1.** The frontend's sign-up form is a preview that sends and saves nothing. The fields below match that form in `frontend/src/pages/auth.js`.

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

`[Post-V1]` **Not built, and not part of V1.**

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

**Logging out** would need no endpoint: the frontend deletes its token.

### 4.10 GET /api/me

`[V1]` **Not built yet.** Requested in #57 so that followed clubs survive a page refresh (#58). #57 does not name a path; `/api/me` is the confirmed V1 path.

**`[V1]`:** no token. Returns the shared demo user. The frontend uses it to get the current followed clubs.

**`[Post-V1]`:** **Auth required** if real accounts are approved.

**200:** User (section 3.4). In V1, exactly `id`, `name`, and `followed_clubs`.

| Status | Body | When |
|---|---|---|
| `401` | `{ "error": "Authentication required" }` | `[Post-V1]` Token missing, invalid, or expired |

### 4.11 GET /api/health

`[On main]` **200:** `{ "status": "ok", "service": "ClubSync Backend" }`. No change needed.

### 4.12 GET /api/events/{id}/calendar (optional)

`[Post-V1]` **Deferred. Not on `main`.** Tracked by #23 and PR #56, which has changes requested and now conflicts with `main`. If kept: **200** returns `text/calendar` with `Content-Disposition: attachment; filename="event_{id}.ics"`, and **404** returns `{ "error": "Event not found" }`.

`[On main]` The frontend already generates `.ics` files itself with `calendarFile()`, and V1 uses that (section 7, decision 6).

## 5. Proposed rollout: demo user first, real accounts second

`[V1]` Phase 1 is V1. `[Post-V1]` Phase 2 is still a proposal, and happens only if the team approves real accounts and a database. Phase 1 builds on what `main` has now. Both phases use the same paths and response shapes, so frontend work done in Phase 1 would carry over.

| | On `main` today | Phase 1: demo user (V1) | Phase 2: real accounts (post-V1, proposed) |
|---|---|---|---|
| Who the user is | Single shared demo user | Single shared demo user | User identified by the token |
| Auth-required endpoints | Work with no token | Work with no token | Return `401` without a valid token |
| `/api/auth/*` | Missing | Missing | Live |
| Where clubs and events come from | In-memory records in `backend/api/` | Sample data files | Database |
| Where follows are stored | Memory, lost on restart and shared by all visitors | Same as today | Database |

**Frontend change needed to move from Phase 1 to Phase 2:** add the sign-in flow and send the token on auth-required requests.

### Shared data loaders (#55)

`[On main]` **PR #55 is merged.** `load_sample_clubs()` and `load_sample_events()` are in `backend/services/sample_data.py`, with tests in `tests/backend/test_sample_data.py`. No endpoint uses them yet.

`[V1]` The loaders become the single source of club and event data. The expected use is:

1. Endpoints call `load_sample_clubs()` and `load_sample_events()` instead of reading the in-memory `CLUBS` and `EVENTS` lists.
2. Endpoints apply filters and sorting, then return the rows without changing their fields.
3. If a loader raises an error, the endpoint returns `500` with `{ "error": "Data unavailable" }` (section 2).

Still undecided:

- Whether to cache data or read the files on each request. The loaders read the files on each call.
- How they are replaced if a database is approved.

The contract only fixes the response shapes, so any of these choices can satisfy it.

## 6. What stays on the frontend

The API never sends these. `[On main]` `prepareDirectory()` already computes them after loading the data:

| Value | Source |
|---|---|
| `event.club` | The club whose `id` equals `event.club_id` |
| `event.category` | `event.tags[0]` |

Also client-side: text search, week grouping, date formatting, and the `club` filter name in `#/events?club=6`. That is a page URL, separate from the API's `club_id` param.

## 7. Decisions for the team to approve

These are the choices this draft proposes where the repo does not settle the question. The last column records the V1 outcome confirmed by the PM on November 5, 2026. Proposals not adopted for V1 stay open for after V1. Yazmyrat, as data owner, approved decisions 1 to 3. For decision 1, club 3 keeps `Culinary arts`.

| # | Decision | Proposed | Why | Main alternative | V1 outcome |
|---|---|---|---|---|---|
| 1 | Category values | Migrate 9 club values to the closed list. Club 3 keeps `Culinary arts`. | One set of values, and no translation layer on either side | Keep free-text values and copy the alias table into the backend | **Not for V1.** Values stay unchanged; the frontend keeps its mapping. Migration is post-V1. |
| 2 | Past events | `/api/events` includes them; `from` and `to` narrow the range | The calendar needs earlier weeks, and #57 asks for this | Upcoming only by default, as on `main`. Breaks the calendar's earlier weeks. | **Confirmed.** `from` and `to` are post-V1. |
| 3 | Event response | Flat, joined by `club_id` | Matches the file exactly | Embed `club`. This creates a second event shape. | **Confirmed.** V1 events are flat records. The club is not embedded. |
| 4 | Token transport | Bearer token in the `Authorization` header, if real accounts are approved | Works across origins whichever hosts are chosen, with no cookie or CSRF setup | HttpOnly session cookie. Safer against XSS, but needs same-site hosting or cross-site cookie and CSRF setup. | Post-V1 |
| 5 | Follow routes | Keep `POST .../follow` and `POST .../unfollow` | Already on `main` and tested | `POST` and `DELETE` on one route. More conventional, but requires a rewrite. | **Confirmed.** V1 keeps the existing paths. |
| 6 | `.ics` export | Keep `calendarFile()` for the current button, and treat the backend endpoint as optional | The frontend version already works and folds long lines | Finish #56 and switch the button to the API | **Confirmed.** Backend export is post-V1. |
| 7 | Sign-up restriction | Any valid email, if real accounts are approved | Keeps testing and demos simple | CCNY email addresses only | Post-V1 |
| 8 | `category=All` | Treated as no filter on list endpoints; the frontend should still omit it | Avoids an error if the UI value reaches the API | Return `400` and require the frontend to omit it | Post-V1, with the `category` filter |
| 9 | Error bodies | The status codes and messages in section 2. Where `main` differs, these are proposals, not current behavior. | One JSON error format everywhere, and consistent with the JSON errors `main` already returns | Return `400` for non-integer path IDs | **Confirmed** for V1 |

## 8. Gap checklist: contract vs. what the backend serves today

Checked by running the app on `main` at `5531d16`. A checked item is on `main`. An unchecked item is not on `main` yet. Items tagged `[Post-V1]` are not required for V1. Other unchecked items are V1 work. Owners follow the checklist in #57 where it assigns them; the others are suggestions.

### Data

- [x] Confirm the club and event format for #27. Approved in Yazmyrat's review of this PR, with club 3 keeping `Culinary arts`. *Yazmyrat*
- [ ] `[Post-V1]` Migrate 9 club `category` values (section 3.2). Club 3 keeps `Culinary arts`. Not part of V1. *Yazmyrat*
- [x] Loaders merged in #55, in `backend/services/sample_data.py`, with tests. No endpoint uses them yet. *Yazmyrat*
- [ ] Validate clubs and events against the agreed format, #29. *Yazmyrat, QA*

### Events

- [x] `GET /api/events/{id}` route, with a JSON `404` for an unknown ID (merged in #59).
- [x] `club_id` filter, with `400` for a non-integer value (merged in #59).
- [ ] `GET /api/events` serves all 12 events in the sample data format. Today: 3 in-memory events with `date` and no `start_time`, `end_time`, or `tags`. *SShrestha57*
- [ ] `GET /api/events/{id}` serves the sample data format. Today: the same 3 in-memory events. *SShrestha57*
- [ ] Stop hiding past events by default. *SShrestha57*
- [ ] `[Post-V1]` Add `category`, `from`, and `to` filtering. Not started. Today these params are silently ignored. *SShrestha57*
- [ ] `[V1]` Sort events by `start_time` as an instant. *SShrestha57*
- [ ] Make `/api/events/personalized` use `start_time` and the same data source, including past events. *sarindashrestha7-max*
- [ ] `[Post-V1]` Add the same filters to `/api/events/personalized`. *sarindashrestha7-max*
- [ ] `[Post-V1]` `GET /api/events/{id}/calendar` is deferred. PR #56 has changes requested and conflicts with `main`. *sarindashrestha7-max*

### Clubs

- [ ] `GET /api/clubs` serves all 14 clubs in the sample data format. Today: 3 in-memory clubs with no `category` or `contact_email`. *SShrestha57*
- [ ] `[Post-V1]` Add `category` filtering, including `category=All`. *SShrestha57*
- [ ] `[Post-V1]` Add `GET /api/clubs/{id}`. Missing today. *Owner needed*
- [ ] Make follow and unfollow accept all 14 clubs. Today: anything other than clubs 1 to 3 returns `404`. *sarindashrestha7-max*

### Users and follows

- [ ] Add the current-user endpoint, `GET /api/me`, returning `id`, `name`, and `followed_clubs`. Missing today. *sarindashrestha7-max*
- [ ] `[Post-V1]` Add `email` to the user response. *Owner needed*
- [ ] `[Post-V1]` If approved, choose and connect a database, with `users`, `clubs`, `events`, and `follows` tables. Today there is none. *Owner needed*
- [ ] `[Post-V1]` If approved, persist follows per user. Today they live in `DEMO_USER`, in memory, shared by everyone, and lost on restart. *Owner needed*

### Authentication

`[Post-V1]` Nothing is built, and real accounts are not part of V1. These apply only if they are approved.

- [ ] `[Post-V1]` Add `POST /api/auth/signup` with salted password hashing. *Owner needed*
- [ ] `[Post-V1]` Add `POST /api/auth/login` and token issuing. *Owner needed*
- [ ] `[Post-V1]` Require a valid token on follow, unfollow, personalized, and me. *Owner needed*
- [ ] `[Post-V1]` Load `SECRET_KEY` and other secrets from the environment. *Backend, DevOps*

### Across the API

- [ ] `[V1]` Return JSON for all errors. Today unknown routes, non-integer path IDs (`404`), and wrong methods (`405`) return HTML. *Owner needed*
- [ ] `[V1]` Return `500` with `{ "error": "Data unavailable" }` when data cannot be loaded. *Owner needed*
- [ ] `[V1]` Restrict CORS to the deployed frontend's origin in production. Today `CORS(app)` allows every origin. *Backend, DevOps*

### Tests

- [x] Test discovery in subfolders, backend coverage reporting in CI, and the club, follow, startup, and loader tests are merged (#50, #51, #54, #55, #60, #62). 18 backend tests pass on `main`.
- [ ] `tests/test_backend_server.py` expects 3 clubs and 3 events with old titles and checks `date`, so it must change when the data does. Those IDs also change meaning: club 1 is Computer Science Club in memory but Math Wizards in the JSON. *Backend, QA*
- [ ] Open PR #61 asserts `date` and that past events are hidden. That is correct today, but it needs updating, because decision 2 is confirmed for V1. *QA*
- [ ] Optional for V1: add contract tests that check each endpoint's response against section 3. V1 endpoints still need automated tests. *QA*

### Frontend (once the API matches)

- [ ] Make `frontend/src/services/data.js` load from the API. It imports the JSON at build time and `calendar.js` reads `events` on import, so startup must wait for data and handle a failed request. *Denisa*
- [ ] `[V1]` Read the API address from `VITE_API_BASE_URL`. *Denisa*
- [ ] Add follow buttons, with followed clubs loaded from `GET /api/me`, and the personalized view. *Denisa*
- [ ] `[Post-V1]` Add club pages. *Denisa*
- [ ] `[Post-V1]` Remove `categoryAliases` if the data migration is approved, except the `Culinary arts` entry that club 3 still needs. *Denisa*
- [ ] `[Post-V1]` Add the real sign-in flow if accounts are approved. *Denisa*
