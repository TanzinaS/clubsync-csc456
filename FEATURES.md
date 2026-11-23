# ClubSync Features

A living list of what ClubSync does and what it will do. Update this file whenever a feature's status or scope changes.

Individual tasks and bugs are tracked on the GitHub Projects board, not here. This file tracks **features**, one level above tasks.

**V1 API contract:** [docs/API_CONTRACT.md](docs/API_CONTRACT.md)

**GitHub project board:** [ClubSync Project Board](https://github.com/users/TanzinaS/projects/1/views/7)

**Status key:** Implemented · In Progress · Post-V1

**Last updated:** 2026-11-22

## Feature List

| Feature | Description | Status | Area | Notes |
|---|---|---|---|---|
| Landing page and navigation | Home page and navigation between ClubSync views | Implemented | Frontend | V1; landing page and navigation are available |
| Events feed | Browse club events with search, category, and club filters | Implemented | Frontend + Backend | V1; uses the Flask Events API |
| Calendar view | Weekly calendar showing club events | In Progress | Frontend + Backend | V1; calendar UI exists, and the personalized-events API is implemented, but the personalized frontend view is not built yet
| Club discovery and selection | Browse clubs and follow or unfollow favorites | Implemented | Frontend + Backend | V1; follow/unfollow API and frontend controls are implemented |
| Club pages | Dedicated page with information and events for one club | Post-V1 | Frontend + Backend | Single-club pages are outside V1 scope |
| Events API | Backend endpoints that serve club and event data | Implemented | Backend | |
| Calendar export (.ics) | Download events as calendar files | Implemented | Frontend | V1 frontend export |
| Shared demo user | One demo user can follow and unfollow clubs and view personalized events | Implemented | Backend | V1; follows are stored in memory and reset when the backend restarts |
| User authentication | Real accounts, sign-up, and login | Post-V1 | Frontend + Backend | V1 uses one shared demo user; real authentication is not implemented |
| Google Calendar integration | Direct integration or synchronization with Google Calendar | Post-V1 | Frontend + Backend | Not implemented; V1 supports frontend .ics downloads instead |
| RSVP | Students mark that they plan to attend club events | Post-V1 | TBD | Not implemented; scope still requires PM approval |

## Open Questions

- Where will real club and event data come from?
- Will club officers be able to post their own events?
- Will RSVP be included?

## Change Log

| Date | Change |
|---|---|
| 2026-10-13 | Initial feature list created |
| 2026-11-22 | Updated V1 feature statuses, separated Post-V1 features, and added project board and API contract links |
