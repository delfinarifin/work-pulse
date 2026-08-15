# Work Pulse — Tasks & Sprints

## Sprint 1 — Database + Core Engine (v1 functional)
**Goal:** File events capture → aggregation → timesheet entries persisted and viewable.
- [x] Create Supabase schema (consultants, clients, work_types, activity_events, timesheet_entries, audit_logs)
- [x] Seed demo data (3 consultants, 4 clients, 5 work types, activity events, timesheet entries)
- [x] Build `lib/data/` data-access layer for all tables
- [x] Build aggregation logic: merge events → timesheet entries (`lib/logic/aggregation.ts`)
- [x] "Log Activity" Server Action writes the event, classifies it, and triggers aggregation in one flow (no separate API routes in v1 — everything is a Server Action)
**DoD:** Logging an activity via the form, and querying `timesheet_entries`, returns the correct aggregated duration. ✅ Done.

## Sprint 2 — Dashboard + Reports (v1 continued)
**Goal:** Visible dashboards and summaries from aggregated data — no login wall.
- [x] Dashboard page: total hours, per-consultant breakdown, top work types
- [x] Timesheet page: list entries, filter by consultant/work type via Reports, edit/delete on Timesheets
- [x] Activity Log page: raw events list with file names, clients, and timestamps
- [x] Reports page: filtered summaries grouped by consultant, job role, work type (date range + consultant + work-type filters)
- [x] Responsive sidebar nav shell
- [x] All pages handle loading / empty / error states
**DoD:** Manager opens app, sees dashboard with seeded data, filters the report by job role — numbers match sum of daily entries. ✅ Done — this is the v1 functional milestone.

## Sprint 3 — Manual Entry + Config
**Goal:** Consultants can edit/add entries; admins configure clients and work types.
- [x] Timesheet entry edit (work type, duration, notes)
- [x] Delete entry with confirmation + audit log
- [ ] Manual entry creation form (currently entries are created via activity aggregation only)
- [ ] Settings: manage clients (CRUD), work types (CRUD), consultants (CRUD)
- [x] Audit log written on every entry change (create via aggregation, update, delete)
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
