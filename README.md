# ClubSync

ClubSync is a web application that helps CCNY students discover campus club events and keep track of them in a personalized calendar.

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
| Frontend framework | Not decided |
| Backend framework | Not decided (Python/Flask suggested) |
| Database | Not decided |
| Deployment platform | Not decided |

When the team makes a decision, update this table and add setup instructions below.

## Setup

Setup instructions will be added once the technology stack is chosen.

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
