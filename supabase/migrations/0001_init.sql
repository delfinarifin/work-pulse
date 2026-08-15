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

insert into work_types (name, category) values
  ('Tax Filing', 'tax'),
  ('Tax Planning', 'tax'),
  ('Bookkeeping', 'accounting'),
  ('Payroll', 'accounting'),
  ('Audit Prep', 'accounting')
on conflict do nothing;

insert into consultants (name, email, job_role) values
  ('Sarah Chen', 'sarah.chen@workpulse.demo', 'Tax Senior'),
  ('Marcus Webb', 'marcus.webb@workpulse.demo', 'Accounting Associate'),
  ('Priya Patel', 'priya.patel@workpulse.demo', 'Tax Manager')
on conflict do nothing;

insert into clients (name, company_name) values
  ('Acme Corp', 'Acme Corporation Ltd'),
  ('Northwind Trading', 'Northwind Trading Co'),
  ('Globex Industries', 'Globex Industries Inc'),
  ('Initech LLC', 'Initech LLC')
on conflict do nothing;

insert into activity_events (consultant_id, client_id, file_name, file_path, event_type, work_type_id, work_type_source, work_type_confidence, started_at, ended_at) values
  ((select id from consultants where email='sarah.chen@workpulse.demo'), (select id from clients where name='Acme Corp'), 'Acme_TaxReturn_2024.xlsx', '/clients/acme/tax/', 'open', (select id from work_types where name='Tax Filing'), 'filename-pattern-match', 0.85, '2024-03-12 09:00:00+00', '2024-03-12 09:47:00+00'),
  ((select id from consultants where email='sarah.chen@workpulse.demo'), (select id from clients where name='Acme Corp'), 'Acme_TaxReturn_2024.xlsx', '/clients/acme/tax/', 'edit', (select id from work_types where name='Tax Filing'), 'filename-pattern-match', 0.85, '2024-03-12 10:05:00+00', '2024-03-12 11:30:00+00'),
  ((select id from consultants where email='sarah.chen@workpulse.demo'), (select id from clients where name='Northwind Trading'), 'Northwind_Planning.pdf', '/clients/northwind/tax/', 'open', (select id from work_types where name='Tax Planning'), 'filename-pattern-match', 0.78, '2024-03-12 13:00:00+00', '2024-03-12 14:15:00+00'),
  ((select id from consultants where email='marcus.webb@workpulse.demo'), (select id from clients where name='Globex Industries'), 'Globex_Books_Q1.xlsx', '/clients/globex/acct/', 'open', (select id from work_types where name='Bookkeeping'), 'filename-pattern-match', 0.82, '2024-03-12 09:30:00+00', '2024-03-12 11:00:00+00'),
  ((select id from consultants where email='marcus.webb@workpulse.demo'), (select id from clients where name='Globex Industries'), 'Globex_Payroll_Mar.xlsx', '/clients/globex/acct/', 'edit', (select id from work_types where name='Payroll'), 'filename-pattern-match', 0.90, '2024-03-12 11:15:00+00', '2024-03-12 12:00:00+00'),
  ((select id from consultants where email='priya.patel@workpulse.demo'), (select id from clients where name='Initech LLC'), 'Initech_Audit_Prep.pdf', '/clients/initech/acct/', 'open', (select id from work_types where name='Audit Prep'), 'filename-pattern-match', 0.80, '2024-03-12 14:00:00+00', '2024-03-12 16:30:00+00'),
  ((select id from consultants where email='sarah.chen@workpulse.demo'), (select id from clients where name='Acme Corp'), 'Acme_TaxReturn_2024.xlsx', '/clients/acme/tax/', 'close', (select id from work_types where name='Tax Filing'), 'filename-pattern-match', 0.85, '2024-03-12 11:35:00+00', null),
  ((select id from consultants where email='marcus.webb@workpulse.demo'), (select id from clients where name='Globex Industries'), 'Globex_Books_Q1.xlsx', '/clients/globex/acct/', 'close', (select id from work_types where name='Bookkeeping'), 'filename-pattern-match', 0.82, '2024-03-12 11:05:00+00', null)
on conflict do nothing;

insert into timesheet_entries (consultant_id, client_id, work_type_id, date, duration_minutes, source) values
  ((select id from consultants where email='sarah.chen@workpulse.demo'), (select id from clients where name='Acme Corp'), (select id from work_types where name='Tax Filing'), '2024-03-12', 132, 'auto'),
  ((select id from consultants where email='sarah.chen@workpulse.demo'), (select id from clients where name='Northwind Trading'), (select id from work_types where name='Tax Planning'), '2024-03-12', 75, 'auto'),
  ((select id from consultants where email='marcus.webb@workpulse.demo'), (select id from clients where name='Globex Industries'), (select id from work_types where name='Bookkeeping'), '2024-03-12', 90, 'auto'),
  ((select id from consultants where email='marcus.webb@workpulse.demo'), (select id from clients where name='Globex Industries'), (select id from work_types where name='Payroll'), '2024-03-12', 45, 'auto'),
  ((select id from consultants where email='priya.patel@workpulse.demo'), (select id from clients where name='Initech LLC'), (select id from work_types where name='Audit Prep'), '2024-03-12', 150, 'auto'),
  ((select id from consultants where email='sarah.chen@workpulse.demo'), (select id from clients where name='Acme Corp'), (select id from work_types where name='Tax Filing'), '2024-03-13', 210, 'auto'),
  ((select id from consultants where email='marcus.webb@workpulse.demo'), (select id from clients where name='Northwind Trading'), (select id from work_types where name='Bookkeeping'), '2024-03-13', 180, 'auto'),
  ((select id from consultants where email='priya.patel@workpulse.demo'), (select id from clients where name='Initech LLC'), (select id from work_types where name='Audit Prep'), '2024-03-13', 120, 'auto'),
  ((select id from consultants where email='sarah.chen@workpulse.demo'), (select id from clients where name='Globex Industries'), (select id from work_types where name='Tax Planning'), '2024-03-14', 95, 'manual'),
  ((select id from consultants where email='marcus.webb@workpulse.demo'), (select id from clients where name='Initech LLC'), (select id from work_types where name='Payroll'), '2024-03-14', 60, 'auto')
on conflict do nothing;

insert into audit_logs (action, entity, entity_id, details) values
  ('entry.create', 'timesheet_entries', gen_random_uuid(), '{"source": "auto", "date": "2024-03-12"}'),
  ('entry.create', 'timesheet_entries', gen_random_uuid(), '{"source": "auto", "date": "2024-03-12"}'),
  ('entry.update', 'timesheet_entries', gen_random_uuid(), '{"before": {"duration_minutes": 200}, "after": {"duration_minutes": 210}}'),
  ('entry.create', 'timesheet_entries', gen_random_uuid(), '{"source": "manual", "date": "2024-03-14"}')
on conflict do nothing;