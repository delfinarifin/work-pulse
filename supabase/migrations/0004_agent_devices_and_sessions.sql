-- Phase 1 of the automatic-capture system: schema foundations for a future
-- desktop agent (devices, idle_periods) and the new activity_sessions entity
-- that both manual/browser capture (now) and the agent (later) will feed.
-- Purely additive — activity_events, timesheet_entries, and every existing
-- table/policy from 0002/0003 are untouched except for three new nullable
-- columns on activity_events.

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id),
  device_name text not null,
  platform text,
  agent_version text,
  api_key_hash text,
  api_key_prefix text,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  pairing_code text,
  pairing_code_expires_at timestamptz,
  last_seen_at timestamptz,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists activity_sessions (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id),
  device_id uuid references devices(id),
  client_id uuid references clients(id),
  service_id uuid,
  task_id uuid,
  work_type_id uuid references work_types(id),
  application_name text,
  window_title text,
  file_name text,
  file_path text,
  started_at timestamptz not null,
  ended_at timestamptz,
  active_duration_minutes int not null default 0 check (active_duration_minutes >= 0),
  idle_duration_minutes int not null default 0 check (idle_duration_minutes >= 0),
  status text not null default 'active' check (status in ('active', 'idle', 'paused', 'offline', 'closed')),
  billable_status text not null default 'billable' check (billable_status in ('billable', 'non_billable', 'internal', 'training', 'administration')),
  classification_method text,
  classification_confidence numeric,
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'confirmed', 'changed', 'ignored')),
  source text not null default 'manual' check (source in ('agent', 'manual')),
  merged_into_session_id uuid references activity_sessions(id),
  notes text,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists idle_periods (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references activity_sessions(id),
  device_id uuid references devices(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes int check (duration_minutes >= 0),
  reason text check (reason in ('no_input', 'screen_lock', 'manual_pause', 'offline')),
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table activity_events add column if not exists session_id uuid references activity_sessions(id);
alter table activity_events add column if not exists device_id uuid references devices(id);
alter table activity_events add column if not exists is_idle boolean not null default false;

alter table devices enable row level security;
alter table activity_sessions enable row level security;
alter table idle_periods enable row level security;

drop policy if exists "devices_own_read" on devices;
create policy "devices_own_read" on devices for select using (auth.uid() = user_id);
drop policy if exists "devices_own_insert" on devices;
create policy "devices_own_insert" on devices for insert with check (auth.uid() = user_id);
drop policy if exists "devices_own_update" on devices;
create policy "devices_own_update" on devices for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "devices_own_delete" on devices;
create policy "devices_own_delete" on devices for delete using (auth.uid() = user_id);

drop policy if exists "activity_sessions_own_read" on activity_sessions;
create policy "activity_sessions_own_read" on activity_sessions for select using (auth.uid() = user_id);
drop policy if exists "activity_sessions_own_insert" on activity_sessions;
create policy "activity_sessions_own_insert" on activity_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "activity_sessions_own_update" on activity_sessions;
create policy "activity_sessions_own_update" on activity_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "activity_sessions_own_delete" on activity_sessions;
create policy "activity_sessions_own_delete" on activity_sessions for delete using (auth.uid() = user_id);

drop policy if exists "idle_periods_own_read" on idle_periods;
create policy "idle_periods_own_read" on idle_periods for select using (auth.uid() = user_id);
drop policy if exists "idle_periods_own_insert" on idle_periods;
create policy "idle_periods_own_insert" on idle_periods for insert with check (auth.uid() = user_id);
drop policy if exists "idle_periods_own_update" on idle_periods;
create policy "idle_periods_own_update" on idle_periods for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "idle_periods_own_delete" on idle_periods;
create policy "idle_periods_own_delete" on idle_periods for delete using (auth.uid() = user_id);
