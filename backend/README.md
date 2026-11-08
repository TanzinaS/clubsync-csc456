# Backend

Server-side code for ClubSync: API endpoints, data handling, authentication, and external integrations.

**Team:** Sangita, Sarinda, Yazmyrat (Backend Developers)
**Framework:** Python / Flask, with Flask-Cors.
**Database:** Not connected; API currently uses in-memory sample data.

Individual responsibilities will be listed in the root README once finalized.

## Folders

| Folder | Purpose | Examples |
|---|---|---|
| `api/` | Endpoints (routes) the frontend calls | Get list of events, get one club |
| `models/` | Definitions of data and database tables | Club, Event, User |
| `services/` | Business logic, kept separate from routes | Filtering events by club, building a user's calendar |
| `integrations/` | Code that talks to outside services | Google Calendar (planned) |

## Configuration and Secrets

Never hard-code API keys, database passwords, or OAuth secrets. Load them from environment variables (a local `.env` file, ignored by Git). When configuration is needed, add a `.env.example` listing variable **names only**, with no real values.

## Setup

See the root README's [setup instructions](../README.md#setup) for virtual environment setup, dependency installation, starting the API, and running tests.


## Demo User Limitations (V1)

ClubSync currently uses a single demo user stored in memory.

- All visitors share the same demo user and followed clubs.
- Followed clubs are lost whenever the Flask server restarts.
- The in-memory demo user is not stored in a database.
- V1 requires a single server worker because multiple workers would maintain separate copies of the demo user.
- The reset_demo_user() function clears followed clubs before tests to prevent tests from affecting one another.

    These limitations are temporary until persistent user accounts and database storage are implemented.