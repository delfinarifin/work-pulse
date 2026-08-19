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

## Desktop Agent — Milestone 1: web side (unblocked, in progress)
**Goal:** True zero-input background capture — a Windows tray agent (Tauri) detecting active
application/window/file metadata (never content) and idle state, syncing securely. The original
"deferred, no Rust/Tauri toolchain" blocker no longer holds — Rust, the MSVC C++ Build Tools,
and WebView2 are now installed on the machine this session runs on (verified with a real
compile, 2026-08-19). `SUPABASE_SERVICE_ROLE_KEY` is provisioned in Vercel and pulled locally.
- [x] `lib/supabase/service.ts` — service-role client, first real use of the key. Server-only,
  never imported from a client component
- [x] `lib/agent/auth.ts` — pairing-code generation, API-key generation/hashing (SHA-256,
  key shown once at pairing time, only the hash is ever stored)
- [x] `/devices` page — consultant generates a pairing code (10-minute TTL), lists their
  devices with status/last-seen, revokes a device
- [x] `POST /api/agent/pair` — exchanges a valid pairing code for a device API key (service
  client; the pairing-code + status + expiry check IS the authorization, not RLS)
- [x] `POST /api/agent/heartbeat` — the core capture loop: bearer-token device auth, then
  `lib/data/agent-sessions.ts` (`recordHeartbeat`) upserts `activity_sessions` — extends the
  active session if the window/file identity is unchanged, closes and classifies a new one
  (reusing `classifySession`) if it changed, tracks idle spans in `idle_periods` and closes the
  session at the consultant's configured idle threshold
- [x] `listActivitySessionsForConsultantOnDate` / `runSessionAggregationForConsultantDate`
  (`lib/data/sessions.ts` / `lib/data/timesheets.ts`) now accept an optional injected
  `SupabaseClient` + `userId` — agent code passes the service client since it has no cookie
  session; every existing caller is unaffected (both params optional, default to prior
  cookie-based behavior)
- [ ] **Native Tauri agent itself — not started.** Everything above is server-side; nothing yet
  actually sends a heartbeat. This is Milestone 2.
- [ ] Recomputes `active_duration_minutes` from wall-clock elapsed time on every heartbeat
  rather than incrementally summing — self-correcting against missed heartbeats, but a genuinely
  stale `active` session (agent killed without a final heartbeat) just stops updating; nothing
  auto-closes it. No cleanup job for orphaned active sessions yet.
**DoD (Milestone 1):** A `curl`/manual `POST` to `/api/agent/pair` with a valid pairing code
returns a working API key; a manual `POST` to `/api/agent/heartbeat` with that key creates a
classified `activity_sessions` row and it shows up on `/activities`. ✅ Verified end-to-end
against the deployed app (2026-08-19) — paired a device, sent two heartbeats for
`Client_ABC_Tax_Return_2024.xlsx` in Excel, confirmed the classified session on `/activities`.

Two real bugs caught during that verification, both fixed and deployed:
- Middleware redirected every unauthenticated request (including `/api/agent/*`) to `/login` as
  an HTML page — the agent's bearer-token auth never got a chance to run. Fixed by exempting
  `/api/agent/*` from that redirect in `lib/supabase/middleware.ts`.
- The `SUPABASE_SERVICE_ROLE_KEY` pasted into Vercel was invalid (copy-paste error) — every
  service-client query failed with "Invalid API key". Re-copied via Supabase's copy-icon button
  (not manual selection) and re-added in Vercel with Production+Preview+Development all checked.

## Desktop Agent — Milestone 2: the native Tauri app (not started)
Tray-only Rust/Tauri app: poll the active window/process via the Windows API every few seconds,
track local idle time, hold the paired API key (needs a decision on local secure storage —
Windows Credential Manager via a Tauri plugin vs. a plain local config file), and POST
heartbeats to `/api/agent/heartbeat`. Auto-start on login, no visible window most of the time.

## Sprint 6 — Role System (expanded scope, foundational)
**Goal:** Distinguish consultant/manager/admin so later features (profitability, capacity
planning, approval workflow, engagement ownership) have someone to scope broader access to.
See `docs/ARCHITECTURE_EXPANSION.md` for the full assessment and sequencing rationale.
- [x] `consultants.role` column (`consultant` / `manager` / `admin`, default `consultant`)
- [x] `current_user_role()` / `is_manager_or_admin()` SECURITY DEFINER helpers
- [x] Additive manager/admin read-only broadening on every owner-scoped operational table
- [x] Admin write access to firm-wide reference data (services/tasks/mappings/rules/work_types)
- [x] Admin UI for services/tasks (added after launch) — rename existing, add new, and remap a
  service's default work type, on Settings. Closes the gap called out as deferred in Sprint 3/5
  ("no admin role yet to gate write access") — the RLS permission existed since this sprint
  landed, the UI just hadn't been built on top of it yet. No delete — services/tasks are
  referenced by mappings/billable_task_rules/sessions/entries with no cascade, same
  don't-hard-delete reasoning as consultants (see `consultant_capacity`/deactivation note above)
- [x] `prevent_role_self_escalation` trigger — a consultant can't grant themselves a role via
  their own `_own_update` policy
- [x] Admin-only "Team & roles" section on Settings to assign roles
- [x] Deactivate/reactivate a consultant (0013, added after launch) — no hard delete, since
  activity_sessions/timesheet_entries/timesheet_submissions/audit_logs all FK into consultants
  with no cascade; deactivation is reversible and keeps history intact. Blocked at middleware on
  every request (not just sign-in), excluded from assignment pickers (`listActiveConsultants`),
  and the `active` column got the same self-escalation guard as `role` — a deactivated
  consultant can't flip themselves back on
- [ ] First admin bootstrap — manual one-time SQL step, not app-driven by design (see
  `docs/DATA_MODEL.md` Role System section) — **must be run once against the live database
  before this is usable**, this task list can't check it off for you
- Decision made: **single-firm, single-tenant** — no `firm_id`. Matches the existing pattern
  where clients/services/tasks are already shared firm-wide reference data.
**DoD:** An admin (once bootstrapped) can see the whole team's activity/timesheets and promote
another consultant to manager/admin from Settings; a non-admin's attempt to change their own
`role` via any update is silently discarded.

**Note:** requires `supabase/migrations/0007_roles.sql` to be applied before deploying app code
that reads `consultant.role` — same schema-then-code-together rule as prior sprints.

## Sprint 7 — Live Dashboards, Graph (later, deferred)
- Submit weekly timesheet → manager approval → lock entries. ✅ Done — see Sprint 10.
- Supabase Realtime live status — the desktop agent (Milestone 1) is now a continuous data
  source, this could be picked up.
- Microsoft Graph/SharePoint integration — needs the firm's Azure AD tenant admin.
- Weekly automated report email.

## AI-Assisted Classification — live (added post-launch)
`lib/classification/layers/ai-metadata.ts` was scaffolded-but-disabled since v1; now implemented
as layer 5 of the classification cascade — one combined Claude API call (`claude-opus-5`) for
client+service+task when the deterministic layers leave something unresolved. Requires
`ANTHROPIC_API_KEY`; falls through to "unclassified" (same as any layer with no match) when
unset. See `docs/ARCHITECTURE.md` "AI Classification Layer" for the two explicit product
decisions this encodes: the taxonomy grows uncontrolled from AI guesses (no review gate), and
non-tax-accounting work (breaks, internal admin) gets classified too rather than left blank.
No schema change — reuses `services`/`tasks`/`activity_classifications`.

## Sprint 8 — Engagements
**Goal:** The bounded client-work unit that profitability, capacity planning, and (loosely)
recurring-work detection roll up against, instead of raw `client_id`. See
`docs/ARCHITECTURE_EXPANSION.md` item 2.
- [x] `engagements` table (client, service, partner/manager, status, dates, budget, billing
  type) — shared firm-wide, manager/admin write
- [x] `engagement_id` nullable FK added to `activity_sessions` and `timesheet_entries`
- [x] Aggregation groups by client+engagement+service+task+billable_status, so time against the
  same client on different engagements doesn't merge into one row
- [x] Log Activity form: optional engagement picker, filtered by the selected client
- [x] `/engagements` page: manager/admin create form + status-transition control; everyone gets
  read access (they need to tag their own sessions against one)
- [ ] No classification-cascade layer suggests an engagement yet — always a manual pick on Log
  Activity, no auto-detection from file name/path (deferred; would follow the same pattern as
  client/service/task suggestion)
- [ ] Timesheet entry edit form doesn't expose engagement_id yet (data layer supports it,
  `editTimesheetEntry` accepts the field — no UI control wired up)
**DoD:** A manager creates an engagement for a client; consultants logging activity against
that client can optionally tag the engagement; Timesheets/Reports carry the engagement through
via `timesheet_entries.engagement_id`. ✅ Done for capture; UI surfacing on Timesheets/Reports
still uses only client/service/task groupings — engagement column not yet displayed there.

**Note:** requires `supabase/migrations/0008_engagements.sql` to be applied before deploying
app code that reads `engagement_id` — same schema-then-code-together rule as prior sprints.

## Sprint 9 — Work Journal
**Goal:** Free-text daily notes, separate from the auto-classified Activity Log. See
`docs/ARCHITECTURE_EXPANSION.md` item 6.
- [x] `work_journal_entries` table (date, content, optional client/engagement link,
  visibility) — owner-scoped, no dependency on engagements or roles
- [x] Manager/admin read granted only when the author sets `visibility` above `'private'` —
  conditional on row data, not a blanket broadening like every other manager-read policy so far
- [x] `/journal` page: create form + list + delete, own entries only
- [ ] No client-facing view for `visibility='client'` — reserved field, not built (see open
  decisions in `docs/ARCHITECTURE_EXPANSION.md`)
- [ ] No UI surface yet for a manager to actually browse team members' shared journal entries
  (RLS grants the read; nothing queries "everyone's manager-visible entries" yet)
**DoD:** A consultant writes a dated journal entry, optionally links it to a client/engagement,
and deletes it later — all audit-logged. ✅ Done for the individual consultant; the manager-side
read surface is schema/RLS-ready but has no page yet.

**Note:** requires `supabase/migrations/0009_work_journal.sql` to be applied before deploying —
same schema-then-code-together rule as prior sprints.

## Sprint 10 — Timesheet Auto-Generation + Approval Workflow
**Goal:** Auto-generated draft submissions instead of the consultant assembling one by hand;
manager approve/reject/reopen with locked entries in between. Hard-depends on the role system
(Sprint 6). See `docs/ARCHITECTURE_EXPANSION.md` item 5, `docs/AGENTIC_LAYER.md`.
- [x] `timesheet_submissions` table + `timesheet_entries.submission_id` nullable FK
- [x] "Generate this week's draft" pulls in already-aggregated entries for the period
  (`attachPeriodEntriesToDraft`) — re-running it just picks up anything new since last call
- [x] Submit (draft/rejected → submitted): owner-only, enforced by
  `enforce_submission_status_transition` trigger — a consultant cannot self-approve
- [x] Approve / Reject (with required reason) / Reopen (with required, audit-logged reason):
  manager/admin only, `/approvals` page
- [x] `enforce_entry_immutability` trigger blocks edit/delete on any entry attached to a
  submitted/approved/locked submission; `runSessionAggregationForConsultantDate` was updated to
  skip (not attempt-then-fail on) locked entries; Timesheets UI hides Edit/Delete and shows
  "Locked" instead
- [x] Sidebar shows "Approvals" only for manager/admin (role plumbed through `app/layout.tsx`)
- [ ] Auto-generation is manual-trigger only ("Generate this week's draft" button) — no
  scheduled/automatic weekly draft creation yet (would need a cron-triggered route, not built)
- [ ] Only the current week is exposed in the UI for drafting; past/future periods aren't
  pickable from the Timesheets page (the data layer takes arbitrary period_start/period_end,
  so this is a UI gap, not a schema one)
**DoD:** A consultant generates this week's draft, submits it; a manager sees it in the pending
queue, approves or rejects with a reason; approved entries can't be edited until a manager
reopens with a reason, which is audit-logged. ✅ Done.

**Note:** requires `supabase/migrations/0010_timesheet_submissions.sql` to be applied before
deploying — same schema-then-code-together rule as prior sprints.

## Sprint 11 — Profitability
**Goal:** Billed value vs. cost vs. budget, by engagement/client. Depends on engagements
(Sprint 8) and the role system (Sprint 6). See `docs/ARCHITECTURE_EXPANSION.md` item 3.
- [x] `billing_rates` table — bill/cost rate per consultant, optionally narrowed to a client/
  engagement/service, most-specific-wins resolution (`lib/logic/profitability.ts`)
- [x] Manager/admin only, no consultant self-read — cost rates are salary-derived, sensitive
- [x] `/profitability` page: set-a-rate form + billed/cost/margin/budget-realization table
  grouped by engagement (falls back to client, then "Unassigned")
- [x] Entries with no resolvable rate for their date are surfaced as "unrated minutes", not
  silently treated as $0 cost
- [ ] No rate editing/deactivation UI yet — only create; an incorrect rate needs a new
  effective-dated row to supersede it (data layer supports this, `effective_to` exists — no
  button wired up to set it)
- [ ] Report is firm-wide always-on-screen — no date-range filter yet (reads all
  `timesheet_entries` every time), fine at current data volume, would need pagination/filtering
  at scale
**DoD:** A manager sets a bill and cost rate for a consultant, logs time against an engagement
with a budget, and the Profitability page shows billed amount, cost, margin, and budget
realization %. ✅ Done.

**Note:** requires `supabase/migrations/0011_billing_rates.sql` to be applied before deploying —
same schema-then-code-together rule as prior sprints.

## Sprint 12 — Capacity Planning
**Goal:** Weekly capacity vs. planned allocation vs. actual logged hours. Depends on
engagements (Sprint 8) and the role system (Sprint 6); built independently of profitability
(Sprint 11), per the assessment's "can run in parallel" call. See
`docs/ARCHITECTURE_EXPANSION.md` item 4.
- [x] `consultant_capacity` (weekly hours over time) + `resource_allocations` (planned hours per
  consultant/engagement/week)
- [x] Self-read for both (not cost-sensitive, unlike billing_rates) via a `consultants.user_id`
  subquery, since the row's own `user_id` is whoever created it (usually a manager), not
  necessarily the consultant it's about — plus manager/admin read-all-write-all
- [x] `/capacity` page: set-capacity form, set-allocation form, and a this-week report
  (capacity / allocated / actual / over-allocated flag) — shares the Monday-start week helper
  (`lib/logic/dates.ts`) extracted from the Sprint 10 Timesheets panel
- [ ] Report is current-week only, same scope limitation as the Sprint 10 submission panel — no
  way to view past/future weeks from the UI yet
- [ ] No capacity/allocation editing UI — only create; a correction needs a new effective-dated
  row (capacity) or is just wrong until someone notices (allocation has no effective-dating at
  all, since it's a single week's plan, not a standing rate)
**DoD:** A manager sets a consultant's weekly capacity and allocates them to an engagement for
the current week; the Capacity page shows capacity vs. allocated vs. actual hours and flags
over-allocation. ✅ Done.

**Note:** requires `supabase/migrations/0012_capacity_planning.sql` to be applied before
deploying — same schema-then-code-together rule as prior sprints.

## Recurring-Work Detection — descoped, not building
Explicitly dropped from scope (2026-08-19), not just deferred — asked twice what should count
as "recurring" (see `docs/ARCHITECTURE_EXPANSION.md` item 7 for the options that were on the
table) and the answer was to skip it. A consultant repeating the same client/task pattern is
normal, expected work — not a signal that needs flagging or surfacing back to them. No schema,
no detection logic. If this changes later, item 7 in `docs/ARCHITECTURE_EXPANSION.md` still has
the design options if anyone wants to revisit.

## Desktop Agent — unblocked 2026-08-19
Rust/Cargo were confirmed missing earlier the same day, then installed (rustup, verified with a
real compile) along with the MSVC C++ Build Tools (needed admin/elevated PowerShell — the user
ran that step) and confirmed WebView2 was already present. See the "Desktop Agent — Milestone 1"
section above for what's built now that the toolchain exists.

---

## Gantt
```
S1 ████████  DB + Core Engine (v1 functional)
S2 ████████  Dashboard + Reports
S3 ████████  Manual Entry + Config
S4 ████████  Lock Down (auth/RLS)
S5 ████████  Automatic Capture & Classification Engine
S6 ████████  Role System (consultant/manager/admin) — expanded scope, foundational
S7 ░░░░░░░░  Approval Workflow + Live Dashboards + AI + Graph (later)
S8 ████████  Engagements — expanded scope
S9 ████████  Work Journal — expanded scope
S10 ████████  Timesheet Auto-Generation + Approval Workflow — expanded scope
S11 ████████  Profitability — expanded scope
S12 ████████  Capacity Planning — expanded scope
    ░░░░░░░  Recurring-Work Detection — descoped 2026-08-19, not building
    █████░░  Desktop Agent (separate track — toolchain unblocked, web side (Milestone 1) live and verified end-to-end, native Tauri app (Milestone 2) not started)
```
**v1 functional milestone: end of Sprint 2.** Current milestone: end of Sprint 12 — capacity
planning live. That closes out the expanded-scope roadmap except the desktop agent (blocked on
toolchain) and recurring-work detection (descoped by request).
