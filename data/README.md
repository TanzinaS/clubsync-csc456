# Sample Data

Fake data for development and testing while the backend and database are being built.

- `sample_clubs.json` — example clubs
- `sample_events.json` — example events; `club_id` links each event to a club

**All entries are fictional placeholders**, not real CCNY clubs or events.

## Draft Fields

These fields are a starting point and will likely change once the backend team designs the database.

**Club:** `id`, `name`, `category`, `description`, `contact_email`

**Event:** `id`, `club_id`, `title`, `description`, `start_time`, `end_time`, `location`, `tags`

Times use ISO 8601 format with the New York time zone offset (e.g. `2026-10-20T12:30:00-04:00`).

Do not put real student personal information in this folder.
