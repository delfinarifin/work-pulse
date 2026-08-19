# Work Pulse — Data Model

## consultants
| Field | Type |
|-------|------|
| id | uuid pk |
| name | text not null |
| email | text unique not null |
| job_role | text not null (e.g., 'Tax Senior', 'Accounting Associate') |
| role | text not null default 'consultant' ('consultant' / 'manager' / 'admin') — see [[Role System]] below |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## clients
| Field | Type |
|-------|------|
| id | uuid pk |
| name | text not null |
| company_name | text |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## engagements
The bounded unit of work between "client" and "individual session/entry" — a specific tax
filing, an annual audit, a bookkeeping retainer. Foundational for profitability, capacity
planning, and (loosely) recurring-work detection (0008; see `docs/ARCHITECTURE_EXPANSION.md`
item 2). Shared firm-wide reference data like `clients`, but write-restricted to manager/admin
since it carries budget data.
| Field | Type |
|-------|------|
| id | uuid pk |
| client_id | uuid not null → clients |
| service_id | uuid nullable → services |
| name | text not null |
| engagement_partner_id / manager_id | uuid nullable → consultants |
| status | text ('active' / 'on_hold' / 'completed' / 'cancelled') |
| start_date, end_date, target_date | date nullable |
| budget_hours, budget_amount | numeric nullable |
| billing_type | text nullable ('hourly' / 'fixed_fee' / 'retainer') |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

`activity_sessions.engagement_id` and `timesheet_entries.engagement_id` are both nullable FKs
into this table — most ad-hoc work (internal meetings, admin time) will never belong to an
engagement, same reasoning as every other optional classification field. Aggregation
(`lib/logic/aggregation.ts`) groups by client+engagement+service+task+billable_status, so time
against the same client but different engagements never merges into one timesheet row.

## work_types
Legacy classification (pre-services/tasks). Kept because `timesheet_entries.work_type_id` is
`NOT NULL` and existing reporting code reads it — every `service` bridges to one via
`default_work_type_id`.
| Field | Type |
|-------|------|
| id | uuid pk |
| name | text not null (e.g., 'Tax Filing', 'Bookkeeping') |
| category | text not null ('tax' or 'accounting') |
| created_at | timestamptz default now() |

## services
Firm-wide practice areas. Read-only via RLS (authenticated read) — no admin role yet to gate
writes, so seeded/edited via migration.
| Field | Type |
|-------|------|
| id | uuid pk |
| name | text not null unique (Tax Compliance, Tax Advisory, Tax Audit Assistance, Transfer Pricing, Accounting, Bookkeeping, Corporate Services, Tax Dispute/Objection, Tax Investigation, Other) |
| default_work_type_id | uuid nullable → work_types |
| created_at | timestamptz default now() |

## tasks
Firm-wide task list (CIT Computation, Tax Return Preparation, Tax Return Review, PPh/VAT
Calculation, Bank Reconciliation, Tax Research, Tax Advisory, Transfer Pricing Documentation,
Financial Statement Preparation, Bookkeeping, Client Meeting, Internal Meeting,
Email/Correspondence, Administration). Same RLS pattern as `services`.
| Field | Type |
|-------|------|
| id | uuid pk |
| name | text not null unique |
| created_at | timestamptz default now() |

## service_mappings / task_mappings
Configurable keyword → service/task rules — the DB-driven successor to the old hardcoded array
in `lib/logic/classify.ts` (now removed; superseded by `lib/classification/`).
| Field | Type |
|-------|------|
| id | uuid pk |
| service_id / task_id | uuid not null → services / tasks |
| pattern | text not null |
| match_scope | text ('filename' / 'path' / 'window_title') |
| priority | int (lower checked first) |
| confidence | numeric |
| active | boolean |
| created_at | timestamptz default now() |

## client_file_mappings
Client-identification rules — layers 1–3 of the client cascade (exact file, folder path,
filename/client code).
| Field | Type |
|-------|------|
| id | uuid pk |
| client_id | uuid not null → clients |
| pattern_type | text ('exact_file' / 'folder_path' / 'filename_regex' / 'client_code') |
| pattern | text not null |
| match_scope | text |
| priority | int |
| active | boolean |
| created_at | timestamptz default now() |

## billable_task_rules
Default billable status per task, with an optional per-client override.
| Field | Type |
|-------|------|
| id | uuid pk |
| task_id | uuid not null → tasks |
| client_id | uuid nullable → clients (override) |
| billable_status | text ('billable' / 'non_billable' / 'internal' / 'training' / 'administration') |
| priority | int |
| active | boolean |
| created_at | timestamptz default now() |

## activity_classifications
Audit trail of the classification layer that won each cascade (client/service/task) for a
session — not every layer attempted, just the winners (see `lib/classification/classifySession.ts`).
| Field | Type |
|-------|------|
| id | uuid pk |
| session_id | uuid not null → activity_sessions |
| layer | text (learned_rule / exact_file / folder_pattern / filename_client_code / window_title / ai_metadata / keyword_mapping) |
| client_id / service_id / task_id | uuid nullable |
| confidence | numeric |
| matched_rule_table / matched_rule_id | text / uuid |
| accepted | boolean |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## activity_learning_rules
A consultant's remembered corrections — checked first, ahead of every firm-wide mapping table.
| Field | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| scope | text ('personal' — always, in this phase; no admin role to promote to 'firm') |
| pattern_type | text ('folder_path' / 'filename_keyword' / 'app_window_title') |
| pattern | text not null |
| match_scope | text |
| client_id / service_id / task_id | uuid nullable |
| billable_status | text nullable |
| confidence | numeric default 0.95 |
| times_applied | int |
| source_session_id | uuid nullable → activity_sessions |
| active | boolean |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## classification_settings
Per-consultant configurable thresholds, lazily created on first Settings visit.
| Field | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null unique → consultants |
| idle_threshold_minutes | int default 5 |
| confidence_auto_accept_threshold | numeric default 0.75 |
| confidence_confirm_threshold | numeric default 0.40 |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## devices
One row per future desktop-agent install — schema-ready, no agent yet (deferred, separate plan).
| Field | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| device_name, platform, agent_version | text |
| api_key_hash, api_key_prefix | text |
| status | text ('pending' / 'active' / 'revoked') |
| pairing_code, pairing_code_expires_at | text / timestamptz |
| last_seen_at | timestamptz nullable |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## activity_sessions
The primary work-unit entity — what the "Log Activity" form creates today, and what the future
desktop agent will create too (via `device_id`/`source='agent'`).
| Field | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| device_id | uuid nullable → devices |
| client_id / service_id / task_id | uuid nullable → clients / services / tasks |
| work_type_id | uuid nullable → work_types (bridged from `services.default_work_type_id`) |
| application_name, window_title, file_name, file_path | text nullable |
| started_at | timestamptz not null |
| ended_at | timestamptz nullable |
| active_duration_minutes, idle_duration_minutes | int |
| status | text ('active' / 'idle' / 'paused' / 'offline' / 'closed') |
| billable_status | text ('billable' / 'non_billable' / 'internal' / 'training' / 'administration') |
| classification_method | text |
| classification_confidence | numeric |
| review_status | text ('unreviewed' / 'confirmed' / 'changed' / 'ignored') |
| source | text ('agent' / 'manual') |
| merged_into_session_id | uuid nullable → activity_sessions (merge lineage) |
| notes | text nullable |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## idle_periods
Idle spans within a session — schema-ready for the agent; not populated yet.
| Field | Type |
|-------|------|
| id | uuid pk |
| session_id | uuid not null → activity_sessions |
| device_id | uuid nullable → devices |
| started_at, ended_at | timestamptz |
| duration_minutes | int |
| reason | text ('no_input' / 'screen_lock' / 'manual_pause' / 'offline') |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## activity_events
Legacy fine-grained event log (pre-sessions), retained for the future agent's raw telemetry
(open/edit/close pings feeding into a grouped `activity_sessions` row). Not written by the
current "Log Activity" flow.
| Field | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| client_id | uuid nullable → clients |
| file_name | text not null |
| file_path | text |
| event_type | text not null ('open' / 'edit' / 'close') |
| work_type_id | uuid nullable → work_types |
| work_type_source | text |
| work_type_confidence | numeric |
| review_status | text default 'unreviewed' |
| started_at | timestamptz not null |
| ended_at | timestamptz |
| session_id | uuid nullable → activity_sessions |
| device_id | uuid nullable → devices |
| is_idle | boolean default false |
| created_at | timestamptz default now() |

## timesheet_entries
| Field | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| client_id | uuid nullable → clients |
| work_type_id | uuid not null → work_types (bridged) |
| service_id / task_id | uuid nullable → services / tasks |
| billable_status | text not null default 'billable' |
| session_id | uuid nullable → activity_sessions |
| date | date not null |
| duration_minutes | int not null default 0 |
| source | text not null default 'auto' ('auto' or 'manual') |
| notes | text |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## audit_logs
Append-only; also serves as `activity_audit_logs` — new code just uses new `action`/`entity`
values (`session.classify`, `session.confirm`, `session.change`, `session.ignore`,
`session.merge`, `session.correct`, `session.delete`, `learning_rule.create`,
`settings.update`) rather than a separate table.
| Field | Type |
|-------|------|
| id | uuid pk |
| user_id | uuid nullable |
| action | text not null |
| entity | text not null |
| entity_id | uuid |
| details | jsonb |
| created_at | timestamptz default now() |

## Role System (0007)
Single-firm, single-tenant — no `firm_id`, every authenticated user is a consultant at the same
firm. `consultants.role` is `consultant` (default) / `manager` / `admin`. Two SECURITY DEFINER
helper functions (`current_user_role()`, `is_manager_or_admin()`) let policies on other tables
check the caller's role without recursing into `consultants`' own RLS.
- Managers/admins get an **additive read-only** broadening on every owner-scoped operational
  table (see below) — they see everyone's data, on top of their own `_own_read` policy. No
  broadened write yet; each later feature (approval workflow, resource allocation) adds the
  specific write grant it needs.
- Admins additionally get write access to firm-wide reference data (`services`, `tasks`,
  `service_mappings`, `task_mappings`, `client_file_mappings`, `billable_task_rules`,
  `work_types`) — the gap called out as deferred in Sprints 3/5.
- `consultants.role` itself is guarded by the `prevent_role_self_escalation` trigger — a
  consultant's own `_own_update` policy still lets them edit their own row (name, job_role,
  etc.), but any role value they try to set is silently discarded unless the caller is already
  an admin. Admins get a separate `consultants_admin_write` policy to edit any consultant's row.
- **Bootstrapping the first admin is a manual, one-time step** — run once in the Supabase SQL
  editor (as `postgres`, bypassing RLS): `update consultants set role = 'admin' where email =
  '...';`. Nobody can self-promote through the app, by design.

## work_journal_entries
Free-text, human-authored daily notes — distinct from `activity_sessions.notes` (per-session,
often auto-populated). No dependency on engagements (0009; see
`docs/ARCHITECTURE_EXPANSION.md` item 6).
| Field | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| date | date not null |
| content | text not null |
| engagement_id / client_id | uuid nullable → engagements / clients |
| visibility | text ('private' / 'manager' / 'client') |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

`visibility='client'` has no client-facing view yet (reserved, not built — see open decisions in
`docs/ARCHITECTURE_EXPANSION.md`). `visibility='manager'` does have teeth: the
`work_journal_entries_manager_read` RLS policy grants managers/admins read on any entry marked
above `'private'`.

## timesheet_submissions
Weekly (or any-period) rollup a consultant submits for manager approval. Auto-generation pulls
in already-aggregated `timesheet_entries` rather than the consultant assembling one by hand
(0010; see `docs/ARCHITECTURE_EXPANSION.md` item 5, `docs/AGENTIC_LAYER.md` submit/reopen spec).
Hard-depends on the role system (0007).
| Field | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| period_start, period_end | date not null |
| status | text ('draft' / 'submitted' / 'approved' / 'rejected' / 'locked') |
| submitted_at, reviewed_at | timestamptz nullable |
| reviewed_by | uuid nullable → consultants |
| rejection_reason | text nullable |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

`timesheet_entries.submission_id` is a nullable FK into this table. Once attached and the
submission reaches `submitted`/`approved`/`locked`, that entry is immutable — enforced by the
`enforce_entry_immutability` trigger on `timesheet_entries` (backstop; app code, specifically
`runSessionAggregationForConsultantDate`, already skips touching locked entries rather than
relying on the trigger to reject the attempt). Reopening a submission (back to `draft`) is the
only way to unlock its entries again.

Status transitions are guarded by the `enforce_submission_status_transition` trigger, same
self-escalation-prevention pattern as `consultants.role` (0007): a non-manager caller (the
submission's own owner) may only move `draft`/`rejected` → `submitted`; every other transition
(approve, reject, reopen, lock) requires the caller to already be manager/admin. `reopen` always
requires and audit-logs a reason, per `docs/AGENTIC_LAYER.md`.

## billing_rates
Bill (client-facing) and cost (internal, salary-derived) rates per consultant, optionally
narrowed to a client/engagement/service — most-specific-wins, same resolution pattern as
`billable_task_rules` (0011; see `docs/ARCHITECTURE_EXPANSION.md` item 3). Depends on
engagements (0008) and the role system (0007). Manager/admin only — no consultant self-read,
since cost rates in particular are sensitive.
| Field | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| client_id / engagement_id / service_id | uuid nullable (override scope) |
| rate_type | text ('bill' / 'cost') |
| amount_per_hour | numeric not null |
| effective_from | date not null |
| effective_to | date nullable |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

`lib/logic/profitability.ts` (`resolveRate`, `computeProfitability`) is pure aggregation over
`timesheet_entries` + `billing_rates` + `engagements.budget_amount` — no new capture surface,
purely a reporting layer on `/profitability`. An entry with no resolvable rate for its date
still counts in `totalMinutes`/`unratedMinutes` but contributes nothing to billed/cost amounts —
surfaced explicitly on the report rather than silently treated as $0 cost.

## consultant_capacity / resource_allocations
Weekly availability over time, and a manager's forward allocation plan against an engagement —
compared against actual logged hours on `/capacity` (0012; see
`docs/ARCHITECTURE_EXPANSION.md` item 4). Depends on engagements (0008) and the role system
(0007); built independently of profitability (0011), per the assessment's "can run in parallel"
call.
| consultant_capacity | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| weekly_hours | numeric not null |
| effective_from | date not null |
| effective_to | date nullable |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

| resource_allocations | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| engagement_id | uuid not null → engagements |
| week_start_date | date not null |
| planned_hours | numeric not null |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

Unlike `billing_rates`, these aren't cost-sensitive, so a consultant gets self-read on top of
manager/admin read-all-write-all — but the self-read check goes through `consultants.user_id`
(`consultant_id in (select id from consultants where user_id = auth.uid())`), not a `user_id`
column on the row itself, since whoever created an allocation (usually a manager) isn't
necessarily the consultant it's about. `lib/logic/capacity.ts` (`resolveWeeklyCapacity`,
`computeCapacityReport`) is pure aggregation, same reporting-layer pattern as profitability.

## RLS Notes
- **Owner-scoped** (`auth.uid() = user_id`), **+ manager/admin broadened read**: consultants,
  activity_sessions, idle_periods, activity_events, activity_classifications,
  activity_learning_rules, classification_settings, timesheet_entries, audit_logs, devices.
- **Owner-scoped, + manager/admin read only when the author opted in**: work_journal_entries
  (`visibility <> 'private'`) — the one table where the broadened read is conditional on the
  row's own data, not blanket.
- **Owner-scoped, + manager/admin broadened read AND write**: timesheet_submissions — the one
  table where managers get write (not just read) beyond their own rows, since approving/
  rejecting/reopening someone else's submission is the entire point of the feature. The owner's
  own write stays limited to the `draft`/`rejected` → `submitted` transition via the
  `enforce_submission_status_transition` trigger.
- **Shared reference data, authenticated-read, admin-write**: clients (still also plain
  authenticated-write, pre-existing — not yet tightened to admin-only), work_types, services,
  tasks, service_mappings, task_mappings, client_file_mappings, billable_task_rules.
- **Shared reference data, authenticated-read, manager/admin-write**: engagements (write is
  manager/admin only, not plain admin — the one exception to the admin-write pattern above,
  since engagement creation/status changes are a manager-level operational action, not firm
  configuration).
- **Manager/admin only, no consultant read at all**: billing_rates — the one table with no
  authenticated-read fallback; a consultant's `select` simply returns nothing.
- **Self-read via `consultants.user_id` lookup (not a `user_id` column on the row), + manager/
  admin read-all-write-all**: consultant_capacity, resource_allocations.
- Anonymous visitors are redirected to `/login` by middleware — there is no demo/no-login mode.
