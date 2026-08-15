create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists job_roles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists work_types (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  category text not null,
  keywords text[] not null default '{}',
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists consultants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  job_role_id uuid references job_roles(id),
  team_id uuid references teams(id),
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id),
  file_name text not null,
  application text not null,
  event_type text not null default 'edit',
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds int not null default 0,
  work_type_id uuid references work_types(id),
  work_type_value text,
  work_type_source text default 'rule-based',
  work_type_confidence numeric default 0.30,
  work_type_review_status text default 'unreviewed',
  project_label text,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table activities add constraint activities_duration_check check (duration_seconds >= 0);
alter table activities add constraint activities_confidence_check check (work_type_confidence >= 0.0 and work_type_confidence <= 1.0);

create table if not exists timesheet_entries (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id),
  date date not null,
  work_type_id uuid references work_types(id),
  job_role_id uuid references job_roles(id),
  total_minutes int not null default 0,
  source text not null default 'auto',
  status text not null default 'draft',
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table timesheet_entries add constraint timesheet_source_check check (source in ('auto','manual'));
alter table timesheet_entries add constraint timesheet_status_check check (status in ('draft','approved','edited'));

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table teams enable row level security;
drop policy if exists "teams_v1_read" on teams;
create policy "teams_v1_read" on teams for select using (true);
drop policy if exists "teams_v1_write" on teams;
create policy "teams_v1_write" on teams for all using (true) with check (true);

alter table job_roles enable row level security;
drop policy if exists "job_roles_v1_read" on job_roles;
create policy "job_roles_v1_read" on job_roles for select using (true);
drop policy if exists "job_roles_v1_write" on job_roles;
create policy "job_roles_v1_write" on job_roles for all using (true) with check (true);

alter table work_types enable row level security;
drop policy if exists "work_types_v1_read" on work_types;
create policy "work_types_v1_read" on work_types for select using (true);
drop policy if exists "work_types_v1_write" on work_types;
create policy "work_types_v1_write" on work_types for all using (true) with check (true);

alter table consultants enable row level security;
drop policy if exists "consultants_v1_read" on consultants;
create policy "consultants_v1_read" on consultants for select using (true);
drop policy if exists "consultants_v1_write" on consultants;
create policy "consultants_v1_write" on consultants for all using (true) with check (true);

alter table activities enable row level security;
drop policy if exists "activities_v1_read" on activities;
create policy "activities_v1_read" on activities for select using (true);
drop policy if exists "activities_v1_write" on activities;
create policy "activities_v1_write" on activities for all using (true) with check (true);

alter table timesheet_entries enable row level security;
drop policy if exists "timesheet_entries_v1_read" on timesheet_entries;
create policy "timesheet_entries_v1_read" on timesheet_entries for select using (true);
drop policy if exists "timesheet_entries_v1_write" on timesheet_entries;
create policy "timesheet_entries_v1_write" on timesheet_entries for all using (true) with check (true);

alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into teams (id, name) values
  ('a0000000-0000-4000-8000-000000000001', 'Enterprise Consulting'),
  ('a0000000-0000-4000-8000-000000000002', 'Digital Transformation')
on conflict do nothing;

insert into job_roles (id, title) values
  ('b0000000-0000-4000-8000-000000000001', 'Senior Consultant'),
  ('b0000000-0000-4000-8000-000000000002', 'Lead Designer'),
  ('b0000000-0000-4000-8000-000000000003', 'Technical Architect')
on conflict do nothing;

insert into work_types (id, label, category, keywords) values
  ('c0000000-0000-4000-8000-000000000001', 'Documentation', 'Writing', array['report','doc','docx','pdf','spec','documentation']),
  ('c0000000-0000-4000-8000-000000000002', 'Design', 'Creative', array['fig','design','mockup','wireframe','prototype']),
  ('c0000000-0000-4000-8000-000000000003', 'Development', 'Engineering', array['.ts','.py','.js','api','code','test','component','function']),
  ('c0000000-0000-4000-8000-000000000004', 'Presentation', 'Communication', array['slide','pptx','deck','presentation']),
  ('c0000000-0000-4000-8000-000000000005', 'Analysis', 'Data', array['sheet','xlsx','csv','budget','analysis','data']),
  ('c0000000-0000-4000-8000-000000000006', 'Unclassified', 'Other', array[]::text[])
on conflict do nothing;

insert into consultants (id, name, email, job_role_id, team_id) values
  ('d0000000-0000-4000-8000-000000000001', 'Sarah Chen', 'sarah.chen@workpulse.io', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001'),
  ('d0000000-0000-4000-8000-000000000002', 'Marcus Reid', 'marcus.reid@workpulse.io', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002'),
  ('d0000000-0000-4000-8000-000000000003', 'Priya Sharma', 'priya.sharma@workpulse.io', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001'),
  ('d0000000-0000-4000-8000-000000000004', 'James Okafor', 'james.okafor@workpulse.io', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002')
on conflict do nothing;

insert into activities (id, consultant_id, file_name, application, event_type, started_at, ended_at, duration_seconds, work_type_id, work_type_value, work_type_source, work_type_confidence, work_type_review_status, project_label) values
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Q4_Client_Report_v2.docx', 'Word', 'edit', '2025-01-15T09:00:00Z', '2025-01-15T10:00:00Z', 3600, 'c0000000-0000-4000-8000-000000000001', 'Documentation', 'rule-based', 0.85, 'unreviewed', 'Acme Corp'),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'Budget_Forecast_2025.xlsx', 'Excel', 'edit', '2025-01-15T10:15:00Z', '2025-01-15T11:00:00Z', 2700, 'c0000000-0000-4000-8000-000000000005', 'Analysis', 'rule-based', 0.80, 'unreviewed', 'Acme Corp'),
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000002', 'Homepage_Redesign_Mockup.fig', 'Figma', 'edit', '2025-01-15T14:00:00Z', '2025-01-15T15:30:00Z', 5400, 'c0000000-0000-4000-8000-000000000002', 'Design', 'rule-based', 0.80, 'unreviewed', 'Globex Redesign'),
  ('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000003', 'api-auth-routes.ts', 'VS Code', 'edit', '2025-01-15T08:30:00Z', '2025-01-15T10:00:00Z', 5400, 'c0000000-0000-4000-8000-000000000003', 'Development', 'rule-based', 0.90, 'unreviewed', 'Initech API'),
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000003', 'integration_test.spec.ts', 'VS Code', 'edit', '2025-01-15T10:15:00Z', '2025-01-15T11:00:00Z', 2700, 'c0000000-0000-4000-8000-000000000003', 'Development', 'rule-based', 0.90, 'unreviewed', 'Initech API'),
  ('e0000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000004', 'Stakeholder_Deck.pptx', 'PowerPoint', 'edit', '2025-01-15T13:00:00Z', '2025-01-15T14:00:00Z', 3600, 'c0000000-0000-4000-8000-000000000004', 'Presentation', 'rule-based', 0.85, 'unreviewed', 'Umbrella Pitch')
on conflict do nothing;

insert into timesheet_entries (id, consultant_id, date, work_type_id, job_role_id, total_minutes, source, status) values
  ('f0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', '2025-01-15', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 60, 'auto', 'draft'),
  ('f0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', '2025-01-15', 'c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', 45, 'auto', 'draft'),
  ('f0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000002', '2025-01-15', 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 90, 'auto', 'draft'),
  ('f0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000003', '2025-01-15', 'c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003', 135, 'auto', 'draft'),
  ('f0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000004', '2025-01-15', 'c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 60, 'auto', 'draft')
on conflict do nothing;

insert into audit_logs (actor, action, target_type, target_id, metadata) values
  ('system', 'rollup.created', 'timesheet_entries', 'f0000000-0000-4000-8000-000000000001', '{"count": 5, "date": "2025-01-15"}'::jsonb),
  ('system', 'activity.classified', 'activities', 'e0000000-0000-4000-8000-000000000001', '{"work_type": "Documentation", "confidence": 0.85}'::jsonb)
on conflict do nothing;