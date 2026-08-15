# Work Pulse — Architecture

## Stack
- **Frontend:** Next.js (App Router, TypeScript, Tailwind)
- **Database:** Supabase (Postgres + RLS)
- **Hosting:** Vercel

## Build Sequencing
- **Now:** File-activity capture → timesheet aggregation → summary dashboards
- **Next:** Manual entry editing, client/work-type config screens, manager approval workflow
- **Later:** Desktop agent for real file watching, per-user auth + RLS, billing export

## Key User Action Flow
1. A file-activity event is written to `activity_events` via the "Log Activity" form (a Server Action simulating a file watcher), which also runs rule-based classification.
2. The same action triggers aggregation on-demand: it merges that consultant's events for the day into `timesheet_entries` grouped by client + work type + date.
3. Dashboard and Reports read aggregated entries and render summaries.
4. Consultant reviews entries on Timesheets, edits work type/duration/notes, or deletes entries — each change is audit-logged.
5. Manager views reports filtered by consultant, job role, work type, client, or date range.

## Responsive Nav Shell
Left sidebar (desktop) with: **Dashboard**, **Log Activity**, **Activity Log**, **Timesheets**, **Reports**. Collapses to hamburger on mobile. (Settings/config screens are a later sprint — not in v1.)

## Layer Plan
1. **Data layer** (`lib/data/`) — all DB reads/writes; typed query functions per object.
2. **App logic** (`lib/logic/`) — aggregation rules, duration calculations, summary queries.
3. **UI** (`app/`) — server components for data, client components for interactivity.
4. **AI module** (`lib/ai/`) — work-type auto-classification (later).

## Why Core Works Without AI
The core is deterministic: file events → time aggregation → summaries. All rules are SQL/TS logic. AI classification of work types is an additive layer that pre-fills `work_type_id` with a confidence score; the consultant can always override.

## Repo Structure
```
app/
  page.tsx (dashboard)  activities/  timesheets/  reports/  layout.tsx
lib/
  data/       # activity-events.ts, timesheets.ts, consultants.ts, clients.ts, work-types.ts, reports.ts, audit-logs.ts
  logic/      # classify.ts, aggregation.ts
  supabase/   # client.ts, server.ts, middleware.ts
  types.ts
```

## Module Map
| Module | Responsibility | Owns | Build Order |
|--------|---------------|------|-------------|
| activity-capture | Write file events to DB | activity_events | 1st |
| aggregation | Merge events into timesheet entries | timesheet_entries | 2nd |
| summaries | Monthly/yearly roll-ups | timesheet_entries (read) | 3rd |
| dashboard | Productivity overview | all (read) | 4th |
| config | Manage clients, work types, consultants | clients, work_types, consultants | 5th |
| ai-classify | Auto-tag work type on events | activity_events.work_type_id | later |
