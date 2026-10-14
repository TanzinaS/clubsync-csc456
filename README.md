# ClubSync

ClubSync is a web application that helps CCNY students discover campus club events and keep track of them in a personalized calendar.

**Course:** CSC 456 — Topics in Software Engineering
**Status:** Sprint 1 — project setup and early development

---

## Goals

- Make it easy for students to find clubs and events they care about.
- Bring club events into one place instead of scattered flyers, emails, and social posts.
- Let students build a personal calendar from the clubs and events they choose.
- Practice a real team software engineering workflow: issues, branches, pull requests, code review, testing, and deployment.

## Proposed Features

| Feature | Status |
|---|---|
| Landing page and navigation | Sprint 1 |
| Club discovery and selection | Planned |
| Events feed | Sprint 1 |
| Personalized calendar view | Sprint 1 |
| Club-specific pages | Planned |
| User authentication | Planned |
| Google Calendar integration | Planned |
| RSVP functionality | Not yet confirmed |

## Team

| Member | Role |
|---|---|
| Tanzina | Project Manager, GitHub Manager, Code Review, Integration, Deployment |
| Denisa | Frontend Developer |
| Sangita | Backend Developer |
| Sarinda | Backend Developer |
| Yazmyrat | Backend Developer |
| Ayman | Quality Assurance (QA) |

See [docs/team-roles.md](docs/team-roles.md) for more detail.

## Repository Structure

```text
ClubSync/
├── .github/            Issue and pull request templates
├── frontend/           User interface code (Denisa)
│   └── src/
│       ├── components/ Reusable UI pieces (navbar, event card, etc.)
│       ├── pages/      Full screens (landing, events feed, calendar, club page)
│       ├── services/   Code that talks to the backend API
│       └── styles/     Stylesheets and shared design values
├── backend/            Server code (Sangita, Sarinda, Yazmyrat)
│   ├── api/            Routes / endpoints the frontend calls
│   ├── models/         Data structures and database models
│   ├── services/       Business logic (filtering events, building calendars)
│   └── integrations/   External services (e.g., Google Calendar)
├── data/               Sample JSON data for development and testing
├── tests/              Test plans and automated tests (Ayman + developers)
├── docs/               Project documentation, sprint notes, decisions
├── .gitignore
├── CONTRIBUTING.md     How to contribute (branches, commits, pull requests)
└── README.md
```

## Technology Stack

**Not finalized.** The folder layout is intentionally framework-neutral.

- Backend: Python/Flask has been suggested, not confirmed.
- Frontend framework: not decided.
- Database: not decided.
- Deployment platform: not decided.

Once the team decides, the choice will be recorded in [docs/decisions.md](docs/decisions.md) and setup instructions will be added to this README.

## How to Contribute (Short Version)

1. Pick or get assigned a GitHub Issue.
2. Pull the latest `main`.
3. Create a branch: `feature/short-description`.
4. Make small, focused commits.
5. Push your branch and open a pull request linked to the issue.
6. Wait for review and approval before merging.

Full details: [CONTRIBUTING.md](CONTRIBUTING.md)

## Current Development Status

- [x] Repository structure created
- [x] Starter documentation written
- [ ] Technology stack decided
- [ ] Backend task assignments finalized
- [ ] Landing page and navigation
- [ ] Events feed
- [ ] Calendar view
- [ ] Sprint 1 report (due October 26, 2026)

## Security

Never commit API keys, passwords, tokens, or other credentials. Keep secrets in a local `.env` file, which is ignored by Git.
