# Work Pulse — Data Model

## consultants
- id uuid PK
- name text
- email text unique
- job_role_id uuid → job_roles.id (nullable)
- team_id uuid → teams.id (nullable)
- user_id uuid (nullable, for lock-down)
- created_at timestamptz

## teams
- id uuid PK
- name text
- user_id uuid (nullable)
- created_at timestamptz

## job_roles
- id uuid PK
- title text
- user_id uuid (nullable)
- created_at timestamptz

## work_types
- id uuid PK
- label text
- category text
- keywords text[] (used by rule-based classifier)
- user_id uuid (nullable)
- created_at timestamptz

## activities
- id uuid PK
- consultant_id uuid → consultants.id
- file_name text
- application text (e.g. "Excel", "Word", "QuickBooks")
- event_type text (open/edit/close)
- started_at timestamptz
- ended_at timestamptz
- duration_seconds int
- work_type_id uuid → work_types.id (AI-suggested)
- work_type_value text — AI field: value = suggested label
- work_type_source text — AI field: "rule-based" | "llm"
- work_type_confidence numeric — AI field: 0.0–1.0
- work_type_review_status text default 'unreviewed' — AI field
- project_label text (nullable)
- user_id uuid (nullable)
- created_at timestamptz

## timesheet_entries
- id uuid PK
- consultant_id uuid → consultants.id
- date date
- work_type_id uuid → work_types.id
- job_role_id uuid → job_roles.id (denormalized for reporting)
- total_minutes int
- source text default 'auto' — 'auto' | 'manual'
- status text default 'draft' — 'draft' | 'approved' | 'edited'
- user_id uuid (nullable)
- created_at timestamptz

## audit_logs
- id uuid PK
- actor text (e.g. "demo-user", consultant name)
- action text (e.g. "timesheet.approve", "activity.create")
- target_type text
- target_id uuid
- metadata jsonb
- user_id uuid (nullable)
- created_at timestamptz

## RLS Notes
All tables: RLS enabled, permissive v1 policies (select/insert/update/delete for all). Lock-down sprint replaces with `auth.uid() = user_id` scoping.