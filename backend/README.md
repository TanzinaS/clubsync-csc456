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

Never hard-code API keys, database passwords, or OAuth secrets. Load them from environment variables (a local `.env` file, ignored by Git).

The `backend/.env.example` file documents the environment variables used by the backend. It contains no real credentials.

### Environment Variables

- `FLASK_DEBUG=false` — Disables Flask debug mode by default. Set to `true` only for local development.
- `FRONTEND_ORIGIN=http://localhost:5173` — Specifies which frontend origin is allowed to access the API.

For production, set `FRONTEND_ORIGIN` to the actual deployed frontend URL in Render's environment settings.

## Setup

See the root README's [setup instructions](../README.md#setup) for virtual environment setup, dependency installation, starting the API, and running tests.

### Install Backend Dependencies

From the repository root:

```bash
python -m pip install -r backend/requirements.txt
```

### Run Flask Locally

From the repository root:

```bash
python backend/app.py
```

The development server runs at:

`http://127.0.0.1:5001`

To test the health endpoint:

```bash
curl http://127.0.0.1:5001/api/health
```

Expected JSON response:

```json
{
  "status": "ok",
  "service": "ClubSync Backend"
}
```

### Run Gunicorn Locally

From the repository root:

```bash
gunicorn --workers 1 --bind 127.0.0.1:5001 --chdir backend app:app
```

Gunicorn runs the Flask application using one worker.

The single-worker setting is required because ClubSync currently stores the demo user in memory.

### Render Deployment Configuration

The backend is prepared for deployment as a Render Web Service.

Use the following settings:

**Root Directory:** Leave blank (repository root).

**Build Command:**

```bash
pip install -r backend/requirements.txt
```

**Start Command:**

```bash
gunicorn --workers 1 --bind 0.0.0.0:$PORT --chdir backend app:app
```

**Environment Variables:**

```text
FLASK_DEBUG=false
FRONTEND_ORIGIN=https://your-frontend-domain.example
```

Replace the example frontend URL with the actual deployed frontend origin.

Render provides the `PORT` environment variable.

The application uses one Gunicorn worker to keep the demo user's in-memory state consistent.

The backend health endpoint is:

`/api/health`

Render service creation and deployment settings will be coordinated with Tanzina.

## Demo User Limitations (V1)

ClubSync currently uses a single demo user stored in memory.

- All visitors share the same demo user and followed clubs.
- Followed clubs are lost whenever the Flask server restarts.
- The in-memory demo user is not stored in a database.
- V1 requires a single server worker because multiple workers would maintain separate copies of the demo user.
- The `reset_demo_user()` function clears followed clubs before tests to prevent tests from affecting one another.

These limitations are temporary until persistent user accounts and database storage are implemented.