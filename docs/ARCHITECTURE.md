# Work Pulse — Architecture

## Stack
Next.js (App Router) + Supabase (Postgres) + Vercel. TypeScript throughout.

## Build Sequencing
**Now (v1):** Activity capture form → rule-based classification → daily roll-up → consultant review → manager dashboard. Demo-first, no login wall.
**Next:** Desktop agent stub → real file-system events → monthly/yearly roll-ups → trend charts.
**Later:** Login + per-user RLS → admin configuration UI → CSV export → approval workflows.

## Key User Action Flow
1. Consultant (or demo form) logs a file activity: file name, application, start, end.
2. Rule engine matches filename keywords to a WorkType; sets classification confidence.
3. Activity is stored with suggested work_type_id + source + confidence.
4. Daily roll-up groups activities by consultant + date + work type → TimesheetEntry rows.
5. Consultant reviews the timesheet: approves or edits work type / duration.
6. Manager dashboard reads approved entries; shows totals by consultant, job role, work type.

## Responsive Nav Shell
Left sidebar (desktop): Dashboard, Log Activity, My Timesheets, Reports. Collapses to hamburger on mobile. Current section highlighted. Keyboard-accessible.

## Layer Plan
1. **Data layer** (`lib/data/`) — all Supabase reads/writes; typed query functions.
2. **App logic** (`lib/logic/`) — rule-based classification, daily roll-up aggregation.
3. **UI** (`app/` + `components/`) — screens and forms calling data layer only.
4. **AI module** (`lib/ai/`) — placeholder for LLM-based classification (later).

## Why Core Runs Without AI
Classification is rule-based (keyword → work type). Roll-up is pure SQL aggregation. The full capture→review→report loop works with zero LLM calls.

## Repo Structure
```
work-pulse/
  app/
    (dashboard)/page.tsx
    activities/new/page.tsx
    timesheets/page.tsx
    reports/page.tsx
  components/
    Sidebar.tsx
    ActivityForm.tsx
    TimesheetTable.tsx
    ReportChart.tsx
  lib/
    data/
      activities.ts
      timesheets.ts
      consultants.ts
      reports.ts
    logic/
      classify.ts
      rollup.ts
    ai/
      classify-llm.ts   (stub, later)
  __tests__/
    classify.test.ts
    rollup.test.ts
```

## Module Map
| Module | Responsibility | Owns | Build Order |
|--------|---------------|------|-------------|
| data-activities | CRUD for file activities | activities table | 1 |
| classifier | Rule-based work-type matching | classify.ts | 2 |
| rollup | Daily timesheet aggregation | timesheet_entries table | 3 |
| data-timesheets | Timesheet review CRUD | timesheet_entries | 4 |
| ui-dashboard | Manager dashboard + charts | reports queries | 5 |
| ui-activity | Log-activity form + list | activities | 6 |
| data-reports | Aggregation queries by role/type | views + queries | 7 |