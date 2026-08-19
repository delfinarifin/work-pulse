# Work Pulse — Agentic Layer

## Risk Levels

### Low (auto-execute)
- **Aggregate events** — merge raw events into timesheet entries automatically.
- **Suggest work type** — pre-fill `work_type_id` on events using rule-based heuristics.
- **Tag idle time** — mark gaps > 10 min as idle.

### Medium (draft → light approval)
- **Create manual timesheet entry** — consultant drafts; saved immediately but flagged `source='manual'`.
- **Update entry work type** — consultant corrects auto-suggested type; logged to audit.

### High (approval required)
- **Submit weekly timesheet** — consultant submits; manager must approve before it locks.
- **Reopen approved timesheet** — manager action; requires reason in audit log.

### Critical (human-only)
- **Delete timesheet entry** — no auto-delete; requires explicit confirmation + audit log with full before-state.
- **Delete consultant or client** — irreversible; admin-only.

## Named Tools
- `aggregate_events` — merges events into entries (low)
- `suggest_work_type` — fills work_type_id on events (low)
- `create_entry` — manual entry creation (medium)
- `update_entry` — edit entry fields (medium)
- `submit_timesheet` — lock entries for approval (high)
- `delete_entry` — hard delete with audit (critical)

## Audit Log Fields
- `action`, `entity`, `entity_id`, `details` (jsonb: before/after values), `user_id`, `created_at`

## v1 vs Later
- **v1:** Auto-aggregation + manual entry CRUD + audit logging.
- **Sprint 10 (expanded scope, live):** Submit/approve/reject/reopen workflow —
  `lib/data/timesheet-submissions.ts` (`submitSubmission`, `approveSubmission`,
  `rejectSubmission`, `reopenSubmission`), gated by the `enforce_submission_status_transition`
  trigger (owner can only submit/resubmit; every other transition needs manager/admin) and the
  `enforce_entry_immutability` trigger (locked entries can't be edited/deleted until reopened).
- **Still later:** AI work-type suggestions with confidence thresholds, automated weekly
  reports.
