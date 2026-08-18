-- Phase 1: the configurable classification engine. Replaces the hardcoded
-- keyword array in lib/logic/classify.ts with DB-driven mapping tables, adds
-- the client-identification cascade, billable-status rules, the learning-rule
-- mechanism, and per-consultant configurable thresholds. Purely additive.
--
-- services/tasks/service_mappings/task_mappings/client_file_mappings/
-- billable_task_rules are firm-wide reference data, same read-only-for-
-- authenticated-users pattern as the existing work_types table — there is no
-- admin/manager role yet to gate write access, so they're seeded here and
-- edited via future migrations until a role system exists.

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_work_type_id uuid references work_types(id),
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table activity_sessions add constraint activity_sessions_service_id_fkey
  foreign key (service_id) references services(id);
alter table activity_sessions add constraint activity_sessions_task_id_fkey
  foreign key (task_id) references tasks(id);

create table if not exists service_mappings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id),
  pattern text not null,
  match_scope text not null default 'filename' check (match_scope in ('filename', 'path', 'window_title')),
  priority int not null default 100,
  confidence numeric not null default 0.8,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists task_mappings (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id),
  pattern text not null,
  match_scope text not null default 'filename' check (match_scope in ('filename', 'path', 'window_title')),
  priority int not null default 100,
  confidence numeric not null default 0.8,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists client_file_mappings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  pattern_type text not null check (pattern_type in ('exact_file', 'folder_path', 'filename_regex', 'client_code')),
  pattern text not null,
  match_scope text not null default 'path' check (match_scope in ('filename', 'path', 'window_title')),
  priority int not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists billable_task_rules (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id),
  client_id uuid references clients(id),
  billable_status text not null check (billable_status in ('billable', 'non_billable', 'internal', 'training', 'administration')),
  priority int not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists activity_classifications (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references activity_sessions(id),
  layer text not null,
  client_id uuid references clients(id),
  service_id uuid references services(id),
  task_id uuid references tasks(id),
  confidence numeric,
  matched_rule_table text,
  matched_rule_id uuid,
  accepted boolean not null default false,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists activity_learning_rules (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id),
  scope text not null default 'personal' check (scope in ('personal', 'firm')),
  pattern_type text not null check (pattern_type in ('folder_path', 'filename_keyword', 'app_window_title')),
  pattern text not null,
  match_scope text not null default 'path' check (match_scope in ('filename', 'path', 'window_title')),
  client_id uuid references clients(id),
  service_id uuid references services(id),
  task_id uuid references tasks(id),
  billable_status text check (billable_status in ('billable', 'non_billable', 'internal', 'training', 'administration')),
  confidence numeric not null default 0.95,
  times_applied int not null default 0,
  source_session_id uuid references activity_sessions(id),
  active boolean not null default true,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists classification_settings (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null unique references consultants(id),
  idle_threshold_minutes int not null default 5 check (idle_threshold_minutes > 0),
  confidence_auto_accept_threshold numeric not null default 0.75,
  confidence_confirm_threshold numeric not null default 0.40,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table services enable row level security;
alter table tasks enable row level security;
alter table service_mappings enable row level security;
alter table task_mappings enable row level security;
alter table client_file_mappings enable row level security;
alter table billable_task_rules enable row level security;
alter table activity_classifications enable row level security;
alter table activity_learning_rules enable row level security;
alter table classification_settings enable row level security;

drop policy if exists "services_authenticated_read" on services;
create policy "services_authenticated_read" on services for select using (auth.role() = 'authenticated');
drop policy if exists "tasks_authenticated_read" on tasks;
create policy "tasks_authenticated_read" on tasks for select using (auth.role() = 'authenticated');
drop policy if exists "service_mappings_authenticated_read" on service_mappings;
create policy "service_mappings_authenticated_read" on service_mappings for select using (auth.role() = 'authenticated');
drop policy if exists "task_mappings_authenticated_read" on task_mappings;
create policy "task_mappings_authenticated_read" on task_mappings for select using (auth.role() = 'authenticated');
drop policy if exists "client_file_mappings_authenticated_read" on client_file_mappings;
create policy "client_file_mappings_authenticated_read" on client_file_mappings for select using (auth.role() = 'authenticated');
drop policy if exists "billable_task_rules_authenticated_read" on billable_task_rules;
create policy "billable_task_rules_authenticated_read" on billable_task_rules for select using (auth.role() = 'authenticated');

drop policy if exists "activity_classifications_own_read" on activity_classifications;
create policy "activity_classifications_own_read" on activity_classifications for select using (auth.uid() = user_id);
drop policy if exists "activity_classifications_own_insert" on activity_classifications;
create policy "activity_classifications_own_insert" on activity_classifications for insert with check (auth.uid() = user_id);

drop policy if exists "activity_learning_rules_own_read" on activity_learning_rules;
create policy "activity_learning_rules_own_read" on activity_learning_rules for select using (auth.uid() = user_id);
drop policy if exists "activity_learning_rules_own_insert" on activity_learning_rules;
create policy "activity_learning_rules_own_insert" on activity_learning_rules for insert with check (auth.uid() = user_id);
drop policy if exists "activity_learning_rules_own_update" on activity_learning_rules;
create policy "activity_learning_rules_own_update" on activity_learning_rules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "activity_learning_rules_own_delete" on activity_learning_rules;
create policy "activity_learning_rules_own_delete" on activity_learning_rules for delete using (auth.uid() = user_id);

drop policy if exists "classification_settings_own_read" on classification_settings;
create policy "classification_settings_own_read" on classification_settings for select using (auth.uid() = user_id);
drop policy if exists "classification_settings_own_insert" on classification_settings;
create policy "classification_settings_own_insert" on classification_settings for insert with check (auth.uid() = user_id);
drop policy if exists "classification_settings_own_update" on classification_settings;
create policy "classification_settings_own_update" on classification_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed services (bridged to existing work_types so old Reports/WorkTypeBadge keep working)
insert into services (name, default_work_type_id) values
  ('Tax Compliance', (select id from work_types where name = 'Tax Filing')),
  ('Tax Advisory', (select id from work_types where name = 'Tax Planning')),
  ('Tax Audit Assistance', (select id from work_types where name = 'Audit Prep')),
  ('Transfer Pricing', (select id from work_types where name = 'Tax Planning')),
  ('Accounting', (select id from work_types where name = 'Payroll')),
  ('Bookkeeping', (select id from work_types where name = 'Bookkeeping')),
  ('Corporate Services', null),
  ('Tax Dispute/Objection', (select id from work_types where name = 'Tax Filing')),
  ('Tax Investigation', (select id from work_types where name = 'Audit Prep')),
  ('Other', null)
on conflict (name) do nothing;

insert into tasks (name) values
  ('CIT Computation'), ('Tax Return Preparation'), ('Tax Return Review'),
  ('PPh/VAT Calculation'), ('Bank Reconciliation'), ('Tax Research'),
  ('Tax Advisory'), ('Transfer Pricing Documentation'), ('Financial Statement Preparation'),
  ('Bookkeeping'), ('Client Meeting'), ('Internal Meeting'),
  ('Email/Correspondence'), ('Administration')
on conflict (name) do nothing;

-- Seed service_mappings from the current classify.ts keyword sets, extended
-- with the new service vocabulary.
insert into service_mappings (service_id, pattern, priority) values
  ((select id from services where name = 'Tax Compliance'), 'tax', 10),
  ((select id from services where name = 'Tax Compliance'), 'spt', 10),
  ((select id from services where name = 'Tax Compliance'), 'pph', 10),
  ((select id from services where name = 'Tax Compliance'), 'ppn', 10),
  ((select id from services where name = 'Tax Compliance'), 'faktur', 10),
  ((select id from services where name = 'Tax Compliance'), 'cit', 10),
  ((select id from services where name = 'Tax Compliance'), 'filing', 10),
  ((select id from services where name = 'Tax Audit Assistance'), 'audit', 20),
  ((select id from services where name = 'Tax Audit Assistance'), 'workpaper', 20),
  ((select id from services where name = 'Tax Audit Assistance'), 'wp', 20),
  ((select id from services where name = 'Transfer Pricing'), 'transfer pricing', 25),
  ((select id from services where name = 'Transfer Pricing'), 'tp doc', 25),
  ((select id from services where name = 'Tax Advisory'), 'planning', 30),
  ((select id from services where name = 'Tax Advisory'), 'advisory', 30),
  ((select id from services where name = 'Tax Advisory'), 'memo', 30),
  ((select id from services where name = 'Bookkeeping'), 'ledger', 40),
  ((select id from services where name = 'Bookkeeping'), 'journal', 40),
  ((select id from services where name = 'Bookkeeping'), 'jurnal', 40),
  ((select id from services where name = 'Bookkeeping'), 'reconciliation', 40),
  ((select id from services where name = 'Bookkeeping'), 'recon', 40),
  ((select id from services where name = 'Bookkeeping'), 'gl', 40),
  ((select id from services where name = 'Bookkeeping'), 'coa', 40),
  ((select id from services where name = 'Bookkeeping'), 'books', 40),
  ((select id from services where name = 'Accounting'), 'payroll', 50),
  ((select id from services where name = 'Accounting'), 'salary', 50),
  ((select id from services where name = 'Accounting'), 'gaji', 50),
  ((select id from services where name = 'Corporate Services'), 'incorporation', 60),
  ((select id from services where name = 'Corporate Services'), 'corporate', 60),
  ((select id from services where name = 'Tax Dispute/Objection'), 'objection', 65),
  ((select id from services where name = 'Tax Dispute/Objection'), 'keberatan', 65),
  ((select id from services where name = 'Tax Investigation'), 'investigation', 70),
  ((select id from services where name = 'Tax Investigation'), 'bukper', 70);

insert into task_mappings (task_id, pattern, priority) values
  ((select id from tasks where name = 'CIT Computation'), 'cit', 10),
  ((select id from tasks where name = 'PPh/VAT Calculation'), 'pph', 15),
  ((select id from tasks where name = 'PPh/VAT Calculation'), 'ppn', 15),
  ((select id from tasks where name = 'PPh/VAT Calculation'), 'vat', 15),
  ((select id from tasks where name = 'Tax Return Review'), 'review', 20),
  ((select id from tasks where name = 'Tax Return Preparation'), 'return', 25),
  ((select id from tasks where name = 'Tax Return Preparation'), 'spt', 25),
  ((select id from tasks where name = 'Bank Reconciliation'), 'reconciliation', 30),
  ((select id from tasks where name = 'Bank Reconciliation'), 'recon', 30),
  ((select id from tasks where name = 'Tax Research'), 'research', 35),
  ((select id from tasks where name = 'Tax Advisory'), 'advisory', 40),
  ((select id from tasks where name = 'Tax Advisory'), 'memo', 40),
  ((select id from tasks where name = 'Transfer Pricing Documentation'), 'transfer pricing', 45),
  ((select id from tasks where name = 'Transfer Pricing Documentation'), 'tp doc', 45),
  ((select id from tasks where name = 'Financial Statement Preparation'), 'financial statement', 50),
  ((select id from tasks where name = 'Financial Statement Preparation'), 'fs', 50),
  ((select id from tasks where name = 'Bookkeeping'), 'ledger', 55),
  ((select id from tasks where name = 'Bookkeeping'), 'journal', 55),
  ((select id from tasks where name = 'Bookkeeping'), 'bookkeeping', 55),
  ((select id from tasks where name = 'Internal Meeting'), 'internal meeting', 60),
  ((select id from tasks where name = 'Internal Meeting'), 'standup', 60),
  ((select id from tasks where name = 'Client Meeting'), 'client meeting', 65),
  ((select id from tasks where name = 'Client Meeting'), 'meeting', 70),
  ((select id from tasks where name = 'Email/Correspondence'), 'email', 75),
  ((select id from tasks where name = 'Email/Correspondence'), 'correspondence', 75),
  ((select id from tasks where name = 'Administration'), 'admin', 80),
  ((select id from tasks where name = 'Administration'), 'administration', 80);

-- Default billable-status overrides — everything else stays the
-- timesheet_entries default of 'billable'.
insert into billable_task_rules (task_id, billable_status) values
  ((select id from tasks where name = 'Internal Meeting'), 'internal'),
  ((select id from tasks where name = 'Administration'), 'administration');
