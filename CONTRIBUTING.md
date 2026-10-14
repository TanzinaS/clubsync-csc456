# Contributing to ClubSync

This guide explains how we work together in this repository. If anything is unclear, ask in the team chat or contact Tanzina (GitHub Manager).

> This workflow is a proposed starting point. The team can adjust it — any changes should be recorded in `docs/decisions.md`.

## 1. Work Starts With an Issue

Every task should have a GitHub Issue before work begins.

- Tanzina creates and manages issues, labels, and assignments.
- If you notice a bug or have an idea, open an issue using the templates.
- Comment on the issue if you are starting work or are blocked.

## 2. Branches

Never commit directly to `main`. `main` should always contain working, reviewed code.

Create a branch from the latest `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/landing-page
```

Branch naming:

| Prefix | Use for | Example |
|---|---|---|
| `feature/` | New functionality | `feature/events-feed` |
| `fix/` | Bug fixes | `fix/calendar-date-offset` |
| `docs/` | Documentation only | `docs/update-readme` |
| `test/` | Tests only | `test/events-api` |

Use lowercase and hyphens.

## 3. Commits

Make small commits with clear messages that say what changed:

```text
Add navigation bar to landing page
Fix event times showing in wrong time zone
Add sample events for testing calendar view
```

Avoid messages like `update`, `stuff`, or `final version`.

## 4. Pull Requests

When your work is ready:

1. Pull the latest `main` into your branch and fix any conflicts.
2. Push your branch: `git push origin your-branch-name`
3. Open a pull request into `main`.
4. Fill out the pull request template.
5. Link the issue (write `Closes #12` in the description).

Keep pull requests small and focused on one task — they are easier to review.

## 5. Code Review

- Tanzina reviews pull requests and handles integration.
- Ayman may test changes before or after merging.
- Respond to review comments and push fixes to the same branch.
- Do not merge your own pull request without approval.

## 6. Testing

- Test your own changes before opening a pull request.
- Describe how you tested in the pull request.
- See `tests/README.md` for where tests go.

## 7. Where Does My Work Go?

| You are working on... | Put it in... |
|---|---|
| A reusable UI element | `frontend/src/components/` |
| A full page/screen | `frontend/src/pages/` |
| Frontend code that calls the API | `frontend/src/services/` |
| Styles | `frontend/src/styles/` |
| An API endpoint | `backend/api/` |
| A data/database model | `backend/models/` |
| Business logic | `backend/services/` |
| Google Calendar or other external service | `backend/integrations/` |
| Sample data | `data/` |
| Tests | `tests/` |
| Documentation | `docs/` |

## 8. Never Commit

- API keys, passwords, tokens, or credentials
- `.env` files
- Dependency folders (`node_modules/`, `venv/`)
- Large files unrelated to the project

If you accidentally commit a secret, tell Tanzina immediately — the secret must be revoked and replaced, not just deleted from the code.
