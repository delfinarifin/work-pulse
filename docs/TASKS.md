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
**Goal:** Visible dashboards and summaries from aggregated data.
- [x] Dashboard page: total hours, per-consultant breakdown, top work types
- [x] Timesheet page: list entries, filter by consultant/work type via Reports, edit/delete on Timesheets
- [x] Activity Log page: raw events list with file names, clients, and timestamps
- [x] Reports page: filtered summaries grouped by consultant, job role, work type (date range + consultant + work-type filters)
- [x] Responsive sidebar nav shell
- [x] All pages handle loading / empty / error states
**DoD:** Manager opens app, sees dashboard with seeded data, filters the report by job role — numbers match sum of daily entries. ✅ Done — this is the v1 functional milestone.

## Sprint 3 — Manual Entry + Config
**Goal:** Consultants can edit/add entries; admins configure clients and work types.
- [x] Timesheet entry edit (work type, service, task, billable status, duration, notes)
- [x] Delete entry with confirmation + audit log
- [x] Manual entry creation — the "Log Activity" form IS the manual entry point (classification
  auto-suggests but never blocks; empty suggestions just leave the fields for direct picking)
- [ ] Settings: manage clients/work-types/consultants (CRUD) — still deferred, no admin role to
  gate write access to firm-wide reference data
- [x] Audit log written on every entry/session change (create via aggregation, update, delete,
  confirm, change, ignore, merge)
**DoD:** Consultant adds a manual 2-hour Bookkeeping entry for a client, edits duration, deletes it — each action appears in audit log. ✅ Done.

## Sprint 4 — Lock It Down (auth + RLS)
**Goal:** Per-user authentication and data isolation.
- [x] Supabase Auth (signup/login) — `/login`, `/signup`, `app/login/actions.ts`
- [x] Replace permissive RLS with owner-scoped policies (`0003_lock_down.sql`)
- [x] Consultant can only see/edit own entries — a consultant row IS the signed-in user's identity, created on first access (`getCurrentConsultant`)
- [x] Anonymous visitors are redirected to `/login` (middleware); signed-in visitors hitting `/login` or `/signup` are redirected to `/`
- [ ] Manager role can read all, write approvals — no role system yet, deferred
- [ ] Admin role can manage config — deferred
**DoD:** Two logged-in consultants see only their own timesheet entries; anonymous visitors are redirected to login. ✅ Done for the single-role case — manager/admin cross-visibility is a later increment.

**Note:** requires `supabase/migrations/0003_lock_down.sql` to be applied to the
database before deploying the app code that depends on it (adds
`activity_events.user_id` + swaps RLS policies) — schema and app code must land
together, never app-code-ahead-of-schema (see incident notes in git history
around commit `e19b5d0`).

## Sprint 5 — Automatic Capture & Classification Engine
**Goal:** Minimize manual input — layered client/service/task classification with confidence
scoring, learning from corrections, billable-status tracking. See `docs/DATA_MODEL.md`,
`docs/INTELLIGENCE_LAYER.md`, `docs/ARCHITECTURE.md` for the full design.
- [x] Schema: `activity_sessions`, `devices`, `idle_periods`, `services`, `tasks`,
  `service_mappings`, `task_mappings`, `client_file_mappings`, `billable_task_rules`,
  `activity_classifications`, `activity_learning_rules`, `classification_settings`; extended
  `activity_events` and `timesheet_entries` (migrations `0004`–`0006`)
- [x] Layered classification engine (`lib/classification/`) with per-consultant confidence
  thresholds
- [x] Live client/service/task suggestion as the consultant types a file name
- [x] Confirm / Change / Ignore review flow on the Activity Log, with confidence badges
- [x] Learning rules — a correction is remembered and auto-applied to future matching files
- [x] Billable / Non-billable / Internal / Training / Administration classification with
  configurable default rules per task
- [x] Merge activity sessions (checkbox selection); delete with audit log
- [x] Timesheets and Reports show service/task/billable breakdowns
- [x] Settings page: per-consultant idle/confidence thresholds, learned-rules list, read-only
  firm-wide service/task/keyword listing
- [ ] Split activity sessions — deferred; a manually-logged atomic entry has no natural split
  boundary, more meaningful once the agent produces continuous multi-purpose sessions
**DoD:** Logging a file whose name matches a seeded keyword mapping auto-suggests client/
service/task with a confidence score; correcting it via Change creates a learning rule that
auto-classifies the same pattern correctly next time; Timesheets/Reports reflect the new
billable/service/task breakdowns. ✅ Done (web-app side — see Sprint 6 for the desktop agent
that would make capture fully hands-free).

**Note:** requires `supabase/migrations/0004_agent_devices_and_sessions.sql`,
`0005_classification_engine.sql`, and `0006_timesheet_extensions.sql` to be applied before
deploying — same schema-then-code-together rule as Sprint 4.

## Sprint 6 — Desktop Agent (deferred, separate plan)
**Goal:** True zero-input background capture — a Windows tray agent (Tauri) detecting active
application/window/file metadata (never content), idle state, and syncing securely.
Deferred because this sandbox has no Node/Rust/Tauri toolchain to build, test, or sign a native
Windows binary, and no real Windows GUI session to verify tray/auto-start/idle-detection
behavior. Schema is already shaped to receive it (`devices`, `activity_sessions.device_id`,
`idle_periods`) — Sprint 6 needs no further migrations, just the agent source, the
`app/api/agent/*` routes, `lib/supabase/service.ts` (first real use of
`SUPABASE_SERVICE_ROLE_KEY`), and `lib/agent/auth.ts`. Not started.

## Sprint 7 — Approval Workflow, Roles, Live Dashboards, AI, Graph (later, deferred)
- Submit weekly timesheet → manager approval → lock entries.
- Manager/admin roles + team utilization dashboards — needs a role system (new).
- Supabase Realtime live status — needs a continuous data source (the agent), so follows
  Sprint 6.
- AI-assisted classification (`lib/classification/layers/ai-metadata.ts`, scaffolded but
  disabled) — needs an LLM API key, not configured.
- Microsoft Graph/SharePoint integration — needs the firm's Azure AD tenant admin.
- Weekly automated report email.

---

## Gantt
```
S1 ████████  DB + Core Engine (v1 functional)
S2 ████████  Dashboard + Reports
S3 ████████  Manual Entry + Config
S4 ████████  Lock Down (auth/RLS)
S5 ████████  Automatic Capture & Classification Engine
S6 ░░░░░░░░  Desktop Agent (deferred — needs a Rust/Tauri build environment)
S7 ░░░░░░░░  Approval + Roles + Live Dashboards + AI + Graph (later)
```
**v1 functional milestone: end of Sprint 2.** Current milestone: end of Sprint 5 — automatic
classification with learning, live in the web app.
