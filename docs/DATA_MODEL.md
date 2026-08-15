# Work Pulse — Data Model

## consultants
| Field | Type |
|-------|------|
| id | uuid pk |
| name | text not null |
| email | text unique not null |
| job_role | text not null (e.g., 'Tax Senior', 'Accounting Associate') |
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

## work_types
| Field | Type |
|-------|------|
| id | uuid pk |
| name | text not null (e.g., 'Tax Filing', 'Bookkeeping') |
| category | text not null ('tax' or 'accounting') |
| created_at | timestamptz default now() |

## activity_events
| Field | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| client_id | uuid nullable → clients |
| file_name | text not null |
| file_path | text |
| event_type | text not null ('open' / 'edit' / 'close') |
| work_type_id | uuid nullable → work_types (AI-suggested) |
| work_type_source | text (AI field source) |
| work_type_confidence | numeric (AI field confidence) |
| review_status | text default 'unreviewed' |
| started_at | timestamptz not null |
| ended_at | timestamptz |
| created_at | timestamptz default now() |

## timesheet_entries
| Field | Type |
|-------|------|
| id | uuid pk |
| consultant_id | uuid not null → consultants |
| client_id | uuid nullable → clients |
| work_type_id | uuid not null → work_types |
| date | date not null |
| duration_minutes | int not null default 0 |
| source | text not null default 'auto' ('auto' or 'manual') |
| notes | text |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## audit_logs
| Field | Type |
|-------|------|
| id | uuid pk |
| user_id | uuid nullable |
| action | text not null (e.g., 'entry.update', 'entry.create') |
| entity | text not null |
| entity_id | uuid |
| details | jsonb |
| created_at | timestamptz default now() |

## RLS Notes
- All tables have RLS enabled.
- v1: permissive read/write policies (demo without login).
- Lock-down: replace with `auth.uid() = user_id` owner-scoped policies.
