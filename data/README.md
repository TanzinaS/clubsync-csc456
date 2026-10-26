
## Draft Fields

These fields are a starting point and will likely change once the backend team designs the database.

**Club:** `id`, `name`, `category`, `description`, `contact_email`

**Event:** `id`, `club_id`, `title`, `description`, `start_time`, `end_time`, `location`, `tags`

Times use ISO 8601 format with the New York time zone offset (e.g. `2026-10-20T12:30:00-04:00`).

Do not put real student personal information in this folder.

## Frontend sample schedule

The frontend reads both JSON files directly through `frontend/src/services/data.js`. The events file contains 12 fictional events across October 13–25, 2026, linked by `club_id` to the clubs file. All timestamps include the New York UTC offset. The first six events populate the October 12–18 calendar shown in the design mocks.

Use the first entry in an event's `tags` array for its display category: Tech, Cultural, Arts, Academic, Sports, Faith, Social, Community Service, or Other. Original club categories such as Engineering and Media are mapped to these display categories in `frontend/src/services/directory.js`.

The current Flask endpoints maintain separate in-memory records; they do not yet read these files.
