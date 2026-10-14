# Backend

Server-side code for ClubSync: API endpoints, data handling, authentication, and external integrations.

**Team:** Sangita, Sarinda, Yazmyrat (Backend Developers)
**Framework:** Not confirmed. Python/Flask has been suggested.
**Database:** Not decided.

Specific responsibilities are still being finalized. Once assigned, they will be listed in `docs/team-roles.md`.

## Folders

| Folder | Purpose | Examples |
|---|---|---|
| `api/` | Endpoints (routes) the frontend calls | Get list of events, get one club |
| `models/` | Definitions of data and database tables | Club, Event, User |
| `services/` | Business logic, kept separate from routes | Filtering events by club, building a user's calendar |
| `integrations/` | Code that talks to outside services | Google Calendar (planned) |

## Areas of Work

- API and server logic
- Database design and management
- User authentication (planned)
- External integrations, e.g. Google Calendar (planned)

## Configuration and Secrets

Never hard-code API keys, database passwords, or OAuth secrets. Load them from environment variables (a local `.env` file, ignored by Git). When configuration is needed, add a `.env.example` listing variable **names only**, with no real values.

## Setup

Setup instructions will be added once the framework is chosen.
