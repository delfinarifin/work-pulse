# WorkPulse — Architecture

## Stack
- **Frontend:** Next.js (App Router, TypeScript, Tailwind)
- **Database:** Supabase (Postgres + RLS)
- **Hosting:** Vercel

## Build Sequencing
- **Now:** File-activity capture → timesheet aggregation → summary dashboards
- **Next:** Manual entry editing, client/work-type config screens, manager approval workflow
- **Later:** Desktop agent for real file watching, per-user auth + RLS, billing export

## Key User Action Flow
1. A file-activity event is written to `activity_events` (via API endpoint simulating a file watcher).
2. A background job (or on-demand trigger) merges overlapping/adjacent events into `timesheet_entries` grouped by consultant + client + work type + date.
3. Dashboard reads aggregated entries and renders monthly/yearly summaries.
4. Consultant reviews entries, edits duration or work type, adds manual entries.
5. Manager views summaries filtered by consultant, job role, or work type.

## Responsive Nav Shell
Left sidebar (desktop) with: **Dashboard**, **Timesheet**, **Activity Log**, **Reports**, **Settings**. Collapses to hamburger on mobile.

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
  dashboard/  timesheet/  activity/  reports/  settings/  layout.tsx
lib/
  data/       # activity_events.ts, timesheet_entries.ts, consultants.ts, etc.
  logic/      # aggregation.ts, summaries.ts
  ai/         # classify_work_type.ts (later)
  types/      # db.ts
tests/
  aggregation.test.ts
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
