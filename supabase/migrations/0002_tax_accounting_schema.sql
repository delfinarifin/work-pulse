-- Replaces the generic-consulting v1 schema (teams, job_roles, activities,
-- work_types.label/keywords) with a tax & accounting consulting schema:
-- consultants (job_role as plain text), clients, work_types (name/category),
-- activity_events, timesheet_entries (duration_minutes/notes), audit_logs
-- (action/entity/entity_id/details). Matches docs/DATA_MODEL.md.
--
-- Old tables/data are demo seed placeholders (see CLAUDE.md) — dropped, not
-- migrated, since there is no real user data to preserve in v1.

drop table if exists timesheet_entries cascade;
drop table if exists activities cascade;
drop table if exists audit_logs cascade;
drop table if exists work_types cascade;
drop table if exists consultants cascade;
drop table if exists job_roles cascade;
drop table if exists teams cascade;

create table if not exists consultants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  job_role text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists work_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('tax', 'accounting')),
  created_at timestamptz not null default now()
);

create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id),
  client_id uuid references clients(id),
  file_name text not null,
  file_path text,
  event_type text not null check (event_type in ('open', 'edit', 'close')),
  work_type_id uuid references work_types(id),
  work_type_source text,
  work_type_confidence numeric,
  review_status text default 'unreviewed',
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists timesheet_entries (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id),
  client_id uuid references clients(id),
  work_type_id uuid not null references work_types(id),
  date date not null,
  duration_minutes int not null default 0 check (duration_minutes >= 0),
  source text not null default 'auto' check (source in ('auto', 'manual')),
  notes text,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table consultants enable row level security;
alter table clients enable row level security;
alter table work_types enable row level security;
alter table activity_events enable row level security;
alter table timesheet_entries enable row level security;
alter table audit_logs enable row level security;

drop policy if exists "consultants_v1_read" on consultants;
create policy "consultants_v1_read" on consultants for select using (true);
drop policy if exists "consultants_v1_write" on consultants;
create policy "consultants_v1_write" on consultants for all using (true) with check (true);

drop policy if exists "clients_v1_read" on clients;
create policy "clients_v1_read" on clients for select using (true);
drop policy if exists "clients_v1_write" on clients;
create policy "clients_v1_write" on clients for all using (true) with check (true);

drop policy if exists "work_types_v1_read" on work_types;
create policy "work_types_v1_read" on work_types for select using (true);
drop policy if exists "work_types_v1_write" on work_types;
create policy "work_types_v1_write" on work_types for all using (true) with check (true);

drop policy if exists "activity_events_v1_read" on activity_events;
create policy "activity_events_v1_read" on activity_events for select using (true);
drop policy if exists "activity_events_v1_write" on activity_events;
create policy "activity_events_v1_write" on activity_events for all using (true) with check (true);

drop policy if exists "timesheet_entries_v1_read" on timesheet_entries;
create policy "timesheet_entries_v1_read" on timesheet_entries for select using (true);
drop policy if exists "timesheet_entries_v1_write" on timesheet_entries;
create policy "timesheet_entries_v1_write" on timesheet_entries for all using (true) with check (true);

drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into work_types (id, name, category) values
  ('dab20465-03a0-4648-9619-36b0637d1e67', 'Tax Filing', 'tax'),
  ('53a1ad02-95aa-4867-a593-3a47c1181991', 'Tax Planning', 'tax'),
  ('92154a01-e607-458d-ad15-68f3494ad05d', 'Bookkeeping', 'accounting'),
  ('e3e9c375-c548-4d8e-b2ca-0e1f83aa3538', 'Payroll', 'accounting'),
  ('b60b4282-c4cc-44f8-9ece-1dcca3cd2756', 'Audit Prep', 'accounting')
on conflict do nothing;

insert into consultants (id, name, email, job_role) values
  ('899c73c9-0f34-433f-b980-932f751917fd', 'Sarah Chen', 'sarah.chen@workpulse.demo', 'Tax Senior'),
  ('54b644d3-7e26-4bfc-982f-760d3c52c847', 'Marcus Webb', 'marcus.webb@workpulse.demo', 'Accounting Associate'),
  ('170998c8-b327-4cbb-bab1-61234d10479d', 'Priya Patel', 'priya.patel@workpulse.demo', 'Tax Manager')
on conflict do nothing;

insert into clients (id, name, company_name) values
  ('240d9592-6031-480c-88b2-f6340954fe53', 'Acme Corp', 'Acme Corporation Ltd'),
  ('dfb7c799-8a49-478d-8364-90f7ec583f3b', 'Northwind Trading', 'Northwind Trading Co'),
  ('59ffe04a-2c8b-447a-a953-d0ca6b4a5ab8', 'Globex Industries', 'Globex Industries Inc'),
  ('98cfecaa-534d-4973-bc25-fd1ccaa76d7f', 'Initech LLC', 'Initech LLC')
on conflict do nothing;

insert into activity_events (consultant_id, client_id, file_name, file_path, event_type, work_type_id, work_type_source, work_type_confidence, started_at, ended_at) values
  ('899c73c9-0f34-433f-b980-932f751917fd', '240d9592-6031-480c-88b2-f6340954fe53', 'Acme_TaxReturn_2024.xlsx', '/clients/acme/tax/', 'edit', 'dab20465-03a0-4648-9619-36b0637d1e67', 'rule-based', 0.85, '2025-01-15T09:00:00Z', '2025-01-15T10:12:00Z'),
  ('899c73c9-0f34-433f-b980-932f751917fd', 'dfb7c799-8a49-478d-8364-90f7ec583f3b', 'Northwind_Tax_Planning_Memo.pdf', '/clients/northwind/tax/', 'edit', '53a1ad02-95aa-4867-a593-3a47c1181991', 'rule-based', 0.8, '2025-01-15T13:00:00Z', '2025-01-15T14:15:00Z'),
  ('54b644d3-7e26-4bfc-982f-760d3c52c847', '59ffe04a-2c8b-447a-a953-d0ca6b4a5ab8', 'Globex_Books_Q1.xlsx', '/clients/globex/acct/', 'edit', '92154a01-e607-458d-ad15-68f3494ad05d', 'rule-based', 0.85, '2025-01-15T09:30:00Z', '2025-01-15T11:00:00Z'),
  ('54b644d3-7e26-4bfc-982f-760d3c52c847', '59ffe04a-2c8b-447a-a953-d0ca6b4a5ab8', 'Globex_Payroll_Mar.xlsx', '/clients/globex/acct/', 'edit', 'e3e9c375-c548-4d8e-b2ca-0e1f83aa3538', 'rule-based', 0.9, '2025-01-15T11:15:00Z', '2025-01-15T12:00:00Z'),
  ('170998c8-b327-4cbb-bab1-61234d10479d', '98cfecaa-534d-4973-bc25-fd1ccaa76d7f', 'Initech_Audit_Workpaper.pdf', '/clients/initech/acct/', 'edit', 'b60b4282-c4cc-44f8-9ece-1dcca3cd2756', 'rule-based', 0.85, '2025-01-15T14:00:00Z', '2025-01-15T16:30:00Z')
on conflict do nothing;

insert into timesheet_entries (consultant_id, client_id, work_type_id, date, duration_minutes, source) values
  ('899c73c9-0f34-433f-b980-932f751917fd', '240d9592-6031-480c-88b2-f6340954fe53', 'dab20465-03a0-4648-9619-36b0637d1e67', '2025-01-15', 72, 'auto'),
  ('899c73c9-0f34-433f-b980-932f751917fd', 'dfb7c799-8a49-478d-8364-90f7ec583f3b', '53a1ad02-95aa-4867-a593-3a47c1181991', '2025-01-15', 75, 'auto'),
  ('54b644d3-7e26-4bfc-982f-760d3c52c847', '59ffe04a-2c8b-447a-a953-d0ca6b4a5ab8', '92154a01-e607-458d-ad15-68f3494ad05d', '2025-01-15', 90, 'auto'),
  ('54b644d3-7e26-4bfc-982f-760d3c52c847', '59ffe04a-2c8b-447a-a953-d0ca6b4a5ab8', 'e3e9c375-c548-4d8e-b2ca-0e1f83aa3538', '2025-01-15', 45, 'auto'),
  ('170998c8-b327-4cbb-bab1-61234d10479d', '98cfecaa-534d-4973-bc25-fd1ccaa76d7f', 'b60b4282-c4cc-44f8-9ece-1dcca3cd2756', '2025-01-15', 150, 'auto')
on conflict do nothing;
