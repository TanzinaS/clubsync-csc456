# ClubSync

ClubSync is a web application that helps CCNY students discover campus club events and keep track of them in a personalized calendar.

The frontend is branded **Campus Groups · CCNY**, with an events timeline, a club directory, and a weekly calendar.

**Course:** CSC 456 — Topics in Software Engineering

> This README describes the project and how the repository is organized. It is only updated for major changes.
> - **Feature status:** [FEATURES.md](FEATURES.md)
> - **Tasks, bugs, and sprints:** GitHub Projects board *(link to be added)*
> - **How to contribute:** [CONTRIBUTING.md](CONTRIBUTING.md)

---

## The Problem

CCNY club events are announced across flyers, emails, social media, and word of mouth. Students easily miss events they would care about, and there is no single place to see them alongside their own schedule.

## Goals

- Make it easy for students to discover clubs and their events.
- Bring club events into one place.
- Let students build a personal calendar from the clubs and events they choose.
- Practice a real team workflow: issues, branches, pull requests, code review, testing, and deployment.

**Primary users:** CCNY students looking for club events.

## Team

| Member | Role | Responsibilities |
|---|---|---|
| Tanzina | Project Manager, GitHub Manager | Sprint planning, GitHub Projects and Issues, code review, integration, deployment |
| Denisa | Frontend Developer | User interface (`frontend/`) |
| Sangita | Backend Developer | Backend (`backend/`) |
| Sarinda | Backend Developer | Backend (`backend/`) |
| Yazmyrat | Backend Developer | Backend (`backend/`) |
| Ayman | Quality Assurance | Test plans, testing, bug reports (`tests/`) |

The backend team collaborates on API/server logic, database management, authentication, and external integrations. Individual backend areas will be listed here once finalized.

## Technology Stack

| Area | Decision |
|---|---|
| Frontend | HTML, CSS, and JavaScript modules, built with Vite |
| Backend framework | Python / Flask, with Flask-Cors |
| Database | Not connected; API currently uses in-memory sample data |
| Deployment platform | Not decided |

## Setup

### Run the web app

Install Node.js 20.19+ (or 22.12+). From the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open **http://127.0.0.1:5173** (or the local URL printed in your terminal). Stop the server with **Ctrl+C**.

The frontend loads `data/sample_events.json` and `data/sample_clubs.json` directly. No backend, database, API keys, or `.env` file are needed to try it. Search, category/club filters, club discovery, event details, calendar navigation, and `.ics` downloads work locally. Sign-in and sign-up screens are UI previews; authentication is not connected and credentials are not saved or transmitted.

The sample schedule runs from November 16 to December 8, 2026. The calendar initially shows November 16–22 with a labeled preview clock. **Today** switches to the real current week in New York time; **Back to sample week** restores the demo.

From `frontend/`, run the frontend checks or build a production bundle:

```bash
npm test
npm run build
npm run preview
```

The production output is in `frontend/dist/`. Preview serves it at **http://127.0.0.1:4173**. See [frontend/README.md](frontend/README.md) for routes and implementation details.

### Run the backend API separately

The Flask API currently has its own in-memory sample data. It is not yet connected to the frontend. No database or credentials are required.

#### 1. Create a virtual environment and install dependencies

Install Python 3.9 or newer. Open a terminal in the repository root (the folder containing this README), then run:

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

**Windows PowerShell:**

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
```

#### 2. Start the backend

With the virtual environment activated, run this from the repository root:

```bash
python backend/app.py
```

The development server starts at **http://127.0.0.1:5001** with debug mode and automatic reload enabled. Stop it with **Ctrl+C**. When returning to the project in a new terminal, activate the virtual environment again before starting the server.

Available endpoints:

| URL | Response |
|---|---|
| http://127.0.0.1:5001/ | Welcome message and server status |
| http://127.0.0.1:5001/api/health | Health check with `"status": "ok"` |
| http://127.0.0.1:5001/api/clubs | Sample clubs |
| http://127.0.0.1:5001/api/events | Sample events dated today or later |

The sample events are dated November 2026, so the events endpoint will return an empty list once all of those dates have passed.

If port 5001 is already in use, start on another port instead:

```bash
python -m flask --app backend/app.py run --debug --port 5002
```

Then use `http://127.0.0.1:5002` for the URLs above.

#### 3. Run the backend tests

From the repository root, with the virtual environment activated:

```bash
python -m unittest discover -s tests -v
```

The tests use Flask's test client, so the server does not need to be running.

## Repository Structure

```text
ClubSync/
├── .github/            Issue and pull request templates
├── frontend/           User interface code
│   └── src/
│       ├── components/ Reusable UI pieces (navbar, event card, etc.)
│       ├── pages/      Full screens (landing, events feed, calendar, club page)
│       ├── services/   Code that talks to the backend API
│       └── styles/     Stylesheets and shared design values
├── backend/            Server code
│   ├── api/            Routes / endpoints the frontend calls
│   ├── models/         Data structures and database models
│   ├── services/       Business logic (filtering events, building calendars)
│   └── integrations/   External services (e.g., Google Calendar)
├── data/               Fictional sample data for development and testing
├── tests/              Test cases and automated tests
├── .gitignore
├── CONTRIBUTING.md     Branches, commits, pull requests
├── FEATURES.md         Living list of features and their status
└── README.md
```

## Workflow Summary

1. Every task, bug, and sprint item lives on the GitHub Projects board.
2. Create a branch from `main` (e.g., `feature/events-feed`).
3. Open a pull request linked to the issue.
4. Tanzina reviews and merges; Ayman tests.

Full details: [CONTRIBUTING.md](CONTRIBUTING.md)

## Security

Never commit API keys, passwords, tokens, or other credentials. Keep secrets in a local `.env` file, which is ignored by Git.
