# Work Pulse — Tasks

## Sprint 1 — Core Engine: Activity Capture + Classification
**Goal:** Log a file activity, auto-classify it, see it in the database.
- Create Supabase tables (migration SQL) + seed demo data
- Build `lib/data/activities.ts` — insert/list activities
- Build `lib/logic/classify.ts` — keyword rule engine
- Build activity log form (`/activities/new`) — file name, app, start/end
- On submit: persist activity + run classifier + store suggested work_type
- Activity list page showing recent activities with classification
- Left sidebar nav shell (Dashboard, Log Activity, Timesheets, Reports)
**DoD:** Submit the log-activity form → row appears in activities table with a classified work_type_id and confidence score.

## Sprint 2 — Roll-up + Timesheet Review (v1 Functional Milestone)
**Goal:** Activities roll into daily timesheet entries; consultant can review.
- Build `lib/logic/rollup.ts` — group activities by consultant + date + work_type → timesheet_entries
- Run rollup on activity create (or on demand button)
- Build `/timesheets` page — list daily entries, approve/edit per entry
- Editing changes work_type_id or total_minutes; status → 'edited' or 'approved'
- Write audit_log on approve/edit
**DoD:** Log 3 activities with different files → daily timesheet entry appears → consultant approves it → entry status = 'approved'. **← v1 functional**

## Sprint 3 — Manager Dashboard + Reports
**Goal:** Manager sees time spent by consultant, job role, work type.
- Build `lib/data/reports.ts` — aggregate queries (by consultant, role, type, date range)
- Build `/` dashboard — bar chart: minutes by work type; table: by consultant
- Build `/reports` page — filter by consultant, date range, work type
- Handle empty state (no activities → friendly message + CTA)
- Loading skeletons on all data-fetching components
**DoD:** With seeded + logged data, manager dashboard shows totals by consultant, job role, and work type; filters work.

## Sprint 4 — Lock It Down (Auth + RLS)
**Goal:** Real per-user data isolation.
- Add Supabase Auth (email/password)
- Signup/login pages; wire user_id on all inserts
- Replace permissive RLS with `auth.uid() = user_id` policies
- Admin role can see all; manager sees team; consultant sees own
- Remove demo-only permissive policies
**DoD:** Logged-in consultant sees only their own activities/timesheets; cannot see another consultant's data.

## Sprint 5 — Polish + Export (Next)
- Monthly/yearly roll-up views
- CSV export of timesheet entries
- Trend charts (weekly time by work type)
- Admin UI for managing work types and job roles

## Text Gantt
```
Sprint 1:  [=====] Activity capture + classify
Sprint 2:       [=====] Roll-up + timesheet review  ← v1 functional
Sprint 3:            [=====] Manager dashboard + reports
Sprint 4:                 [=====] Lock down (auth + RLS)
Sprint 5:                      [=====] Export + admin + trends
```