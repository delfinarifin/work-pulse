# Work Pulse — Architecture Assessment: Expanded Scope

Covers the six items queued beyond Sprint 5: desktop agent, engagement intelligence,
client/engagement profitability, capacity planning, timesheet auto-generation with approval
workflow, work journal, and recurring-work detection. This is an assessment (schema shape,
dependencies, sequencing, risk) — not an implementation plan. Confirm sequencing before coding.

## Cross-cutting blocker: role system

Four of the seven items need to know who's a manager/admin vs. a consultant, and this app has
**no role table at all** today (`consultants.job_role` is a free-text label, not a permission
level). Profitability rollups, capacity planning, approval workflow, and (to assign engagement
owners) engagement intelligence all read or write data beyond "my own rows" — which is exactly
what current RLS forbids (`auth.uid() = user_id` ownership scoping only).

**Recommendation:** build the role system once, first, as its own sprint — not bundled into
any single feature. Shape:
- `consultants.role` (text: `consultant` / `manager` / `admin`), or a separate `user_roles` table
  if a consultant can hold multiple roles later.
- New RLS policies: managers/admins get a broadened read (and scoped write) policy per table,
  additive to the existing owner-scoped policy — never replacing it, since consultants must keep
  seeing only their own rows by default.
- A `firm_id` or single-tenant assumption needs deciding now — the current schema has no tenant
  boundary at all (every table is just owner-scoped by `user_id`). If Work Pulse is meant for one
  firm, that's fine as-is. If multiple firms will ever use it, retrofitting a tenant column after
  roles exist is much more painful than adding it alongside roles now. **This needs a decision
  before the role migration is written**, not after.

Everything below assumes this sprint lands first.

## 1. Desktop Agent (Sprint 6 — already speced, revisit the blocker)

`docs/TASKS.md` deferred this because "this sandbox has no Node/Rust/Tauri toolchain." **That
premise may no longer hold** — this session is running directly on a Windows machine
(`win32`, PowerShell), not a sandboxed container. Worth a quick toolchain check (`rustc
--version`, `cargo --version`, `node --version`) before continuing to treat this as blocked;
if the toolchain is installable, this sprint may be unblockable now, ahead of the other items
below.

Schema is already in place (`devices`, `activity_sessions.device_id`, `idle_periods`) — no new
migration needed to start. Remaining work: the Tauri tray app itself, `app/api/agent/*` routes,
`lib/supabase/service.ts` (first use of the service-role key — a real secret-handling change,
review carefully), `lib/agent/auth.ts` (device pairing/API-key auth, separate from Supabase
Auth). This is a real native-app build+sign+distribute problem, independent of the web app's
sprint rhythm — treat it as a parallel track, not a gate on the other six items.

## 2. Engagement Intelligence

Today, work is tagged to a `client_id` directly — there's no unit between "client" and
"individual session/entry" representing a bounded piece of work (a specific tax filing, an
annual audit, a bookkeeping retainer). Profitability, capacity planning, and recurring-work
detection all want to roll up against *that* unit, not raw client_id, so this is the
foundational new object the other three build on.

New table: `engagements`
| Field | Type |
|---|---|
| id | uuid pk |
| client_id | uuid not null → clients |
| service_id | uuid nullable → services |
| name | text not null |
| engagement_partner_id / manager_id | uuid nullable → consultants |
| status | text (`active` / `on_hold` / `completed` / `cancelled`) |
| start_date, end_date, target_date | date nullable |
| budget_hours, budget_amount | numeric nullable |
| billing_type | text (`hourly` / `fixed_fee` / `retainer`) |
| recurrence | text nullable (see §6 — links to recurring-work detection) |
| user_id | uuid nullable |
| created_at | timestamptz |

Then: add `engagement_id uuid nullable → engagements` to `activity_sessions` and
`timesheet_entries`. Nullable, not required — a lot of ad-hoc work (internal meetings,
admin time) will never belong to an engagement, and backfilling existing rows to a
required FK isn't realistic. The classification cascade would need a new (optional) layer
to suggest an engagement, similar to how it suggests client/service/task today.

## 3. Client / Engagement Profitability

Needs two things neither exists today: a **billing rate** and a **cost rate**. Right now the
app tracks minutes and billable-status, never money.

New table: `billing_rates` — rate scoped to consultant, and optionally overridden per
service/client/engagement (most-specific-wins, same pattern as `billable_task_rules`):
| Field | Type |
|---|---|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| client_id / engagement_id / service_id | uuid nullable (override scope) |
| rate_type | text (`bill` / `cost`) |
| amount_per_hour | numeric not null |
| effective_from, effective_to | date |
| user_id | uuid nullable |

Profitability logic (`lib/logic/profitability.ts`, new): for an engagement or client, sum
`timesheet_entries.duration_minutes` by consultant → apply the resolved bill rate → billed
value; apply cost rate → cost; compare to `engagements.budget_amount` for realization %. This
is pure aggregation over existing + new tables, no new capture surface needed — mostly a
reporting/dashboard feature once rates and engagements exist. Depends on #2 (engagements) and
benefits from #1's role system (managers/admins are the primary audience — a consultant
probably shouldn't see firm-wide margin).

## 4. Capacity Planning

Needs consultant availability and planned (not just actual) allocation — two more new
concepts.

New tables:
- `consultant_capacity` — `consultant_id, weekly_hours, effective_from, effective_to` (handles
  part-time changes, leave, etc. over time rather than a single static number).
- `resource_allocations` — `consultant_id, engagement_id, week_start_date, planned_hours` — a
  manager's forward plan, compared against actual `timesheet_entries` for that
  consultant/engagement/week.

Dashboard is a new report: planned vs. capacity (over/under-allocated) and planned vs. actual
(forecast accuracy). Depends on #1 (managers do the allocating) and #2 (allocations are
per-engagement). No capture-path changes — this is a planning/reporting feature layered on top.

## 5. Timesheet Auto-Generation + Approval Workflow

This is the one item that already has a design on paper — `docs/AGENTIC_LAYER.md` specs
`submit_timesheet` (high-risk, approval-required) and `Reopen approved timesheet` — just never
built. "Auto-generation" is the new half: at period end (weekly), roll up that consultant's
`activity_sessions`/`timesheet_entries` into a draft submission automatically, so the consultant
reviews and submits rather than assembling it by hand — this is a natural extension of the
aggregation logic that already exists (`lib/logic/aggregation.ts`), not a new capture
mechanism.

New table: `timesheet_submissions`
| Field | Type |
|---|---|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| period_start, period_end | date not null |
| status | text (`draft` / `submitted` / `approved` / `rejected` / `locked`) |
| submitted_at, reviewed_at | timestamptz nullable |
| reviewed_by | uuid nullable → consultants (the manager) |
| rejection_reason | text nullable |
| user_id | uuid nullable |

Add `timesheet_entries.submission_id uuid nullable → timesheet_submissions`. Once a
submission is `submitted`/`approved`, its entries become immutable to the owning consultant
(RLS write policy must check submission status, not just ownership — a real change to the
existing owner-scoped write policies, needs care not to lock managers out of their own
approve/reject write). Hard-depends on #1 (there is no one to approve without a manager role).

## 6. Work Journal

The narrowest-scoped item — a free-text, human-authored layer distinct from the structured
`activity_sessions.notes` (which is per-session and often auto-populated). A work journal reads
more like a daily log entry a consultant writes for themselves or for client-facing summaries.

New table: `work_journal_entries`
| Field | Type |
|---|---|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| date | date not null |
| content | text not null |
| engagement_id / client_id | uuid nullable (optional link) |
| visibility | text (`private` / `manager` / `client`) |
| user_id | uuid nullable |

No dependency on anything else — could ship standalone, before or in parallel with the role
sprint. `visibility='client'` implies a future client-facing view that doesn't exist yet
(out of scope for now — just reserve the field so the migration doesn't need revisiting).

## 7. Recurring-Work Detection — DESCOPED (2026-08-19)

Asked the product owner what should count as "recurring" (options below were on the table);
the answer was that a consultant repeating the same client/task pattern is normal, expected
work, not a signal that needs flagging. Not building this. Left the original analysis below for
reference in case this gets revisited later.

Analytical, not transactional — mines historical `timesheet_entries` (or
`activity_learning_rules`, which already captures "this pattern → this client/service/task")
for a consultant+client+service/task combination that recurs on a regular cadence (e.g. monthly
bank reconciliation, quarterly VAT filing), then surfaces "this is due" or pre-populates it as
an expected entry.

New table: `recurring_work_patterns`
| Field | Type |
|---|---|
| id | uuid pk |
| consultant_id | uuid nullable → consultants (nullable if firm-wide pattern) |
| client_id | uuid not null → clients |
| engagement_id / service_id / task_id | uuid nullable |
| cadence | text (`weekly` / `monthly` / `quarterly` / `annual`) |
| typical_day_of_period | int nullable |
| typical_duration_minutes | int nullable |
| last_occurred_at | date nullable |
| confidence | numeric |
| status | text (`detected` / `confirmed` / `dismissed`) |
| user_id | uuid nullable |

Detection itself is a batch job (a scheduled Server Action or cron-triggered route, not
something the live request path should compute) that groups historical entries by
client+service/task and checks interval regularity. This is the highest-uncertainty item on the
list — "regular enough to call recurring" needs a threshold that's genuinely a product decision
(3 consecutive months? Something looser?), worth a short explicit design pass before writing the
detection query, not folded silently into the migration. Benefits from #2 (engagement_id gives a
cleaner grouping key than raw client_id) but doesn't strictly require it — could ship against
client_id alone if engagements aren't ready yet.

## Suggested Sequencing

1. **Role system + tenant decision** — unblocks 3, 4, 5; needed for 2's engagement-owner field
   to mean anything.
2. **Engagements** — foundational object for 3, 4, and (loosely) 7.
3. **Work journal** — independent, ship anytime, good low-risk filler between the above.
4. **Timesheet auto-generation + approval** — biggest workflow change (RLS write-lock
   semantics); do after roles are solid and tested.
5. **Profitability** and **Capacity planning** — both mostly reporting layers once 1+2 exist;
   can run in parallel with each other.
6. **Recurring-work detection** — last; wants real historical data across several periods to be
   useful at all, and its "what counts as recurring" threshold is easier to tune once real
   engagement-level data exists.
7. **Desktop agent** — independent native-app track; re-check the Rust/Tauri toolchain
   assumption now that the environment differs from when it was deferred, and run it in
   parallel with whichever of the above the team is on.

## Open decisions before coding starts

- Single-firm vs. multi-tenant — affects whether a `firm_id` column gets added now or never.
- Role granularity — is "manager" scoped to specific consultants/engagements, or global read
  access to everything? Affects RLS policy complexity a lot.
- Recurring-work confidence threshold and what action it triggers (silent suggestion vs.
  notification vs. auto-draft entry).
- Whether `work_journal_entries.visibility='client'` is really in scope, or should be dropped
  until a client-facing surface is actually planned.
