# WorkPulse — Tasks & Sprints

## Sprint 1 — Database + Core Engine (v1 functional)
**Goal:** File events capture → aggregation → timesheet entries persisted and viewable.
- [ ] Create Supabase schema (consultants, clients, work_types, activity_events, timesheet_entries, audit_logs)
- [ ] Seed demo data (3 consultants, 4 clients, 5 work types, 20+ events, 10+ entries)
- [ ] Build `lib/data/` data-access layer for all tables
- [ ] Build aggregation logic: merge events → timesheet entries
- [ ] API endpoint `POST /api/activity` to write file events
- [ ] API endpoint `POST /api/aggregate` to trigger aggregation for a date range
**DoD:** Posting a file event via API, triggering aggregation, and querying `timesheet_entries` returns the correct duration.

## Sprint 2 — Dashboard + Reports (v1 continued)
**Goal:** Visible dashboards and summaries from aggregated data — no login wall.
- [ ] Dashboard page: total hours, per-consultant breakdown, top work types
- [ ] Timesheet page: list entries by date, filter by consultant/work type
- [ ] Activity Log page: raw events list with file names and timestamps
- [ ] Reports page: monthly + yearly summaries grouped by consultant, job role, work type
- [ ] Responsive sidebar nav shell
- [ ] All pages handle loading / empty / error states
**DoD:** Manager opens app, sees dashboard with seeded data, drills into monthly report by job role — numbers match sum of daily entries.

## Sprint 3 — Manual Entry + Config
**Goal:** Consultants can edit/add entries; admins configure clients and work types.
- [ ] Timesheet entry create/edit form (manual entries)
- [ ] Delete entry with confirmation + audit log
- [ ] Settings: manage clients (CRUD), work types (CRUD), consultants (CRUD)
- [ ] Audit log written on every entry change
**DoD:** Consultant adds a manual 2-hour Bookkeeping entry for a client, edits duration, deletes it — each action appears in audit log.

## Sprint 4 — Lock It Down (auth + RLS)
**Goal:** Per-user authentication and data isolation.
- [ ] Supabase Auth (signup/login)
- [ ] Replace permissive RLS with owner-scoped policies
- [ ] Consultant can only see/edit own entries
- [ ] Manager role can read all, write approvals
- [ ] Admin role can manage config
**DoD:** Two logged-in consultants see only their own timesheet entries; anonymous visitors are redirected to login.

## Sprint 5 — Approval Workflow + AI Classify (later)
**Goal:** Manager approval flow + AI work-type suggestions.
- [ ] Submit weekly timesheet → manager approval → lock entries
- [ ] AI work-type classification with confidence + review_status
- [ ] Weekly automated report email

---

## Gantt
```
S1 ████████  DB + Core Engine (v1 functional)
S2 ████████  Dashboard + Reports
S3 ████████  Manual Entry + Config
S4 ░░░░░░░░  Lock Down (auth/RLS)
S5 ░░░░░░░░  Approval + AI (later)
```
**v1 functional milestone: end of Sprint 2** (success scenario usable end-to-end).
