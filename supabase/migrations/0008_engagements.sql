-- Sprint 8 (expanded scope): engagements — the bounded unit of work between
-- "client" and "individual session/entry" that profitability, capacity
-- planning, and recurring-work detection all want to roll up against. See
-- docs/ARCHITECTURE_EXPANSION.md item 2. Purely additive: existing
-- activity_sessions/timesheet_entries rows keep working with
-- engagement_id = null, same pattern as every other optional classification
-- field in this schema.

create table if not exists engagements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  service_id uuid references services(id),
  name text not null,
  engagement_partner_id uuid references consultants(id),
  manager_id uuid references consultants(id),
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  target_date date,
  budget_hours numeric,
  budget_amount numeric,
  billing_type text check (billing_type in ('hourly', 'fixed_fee', 'retainer')),
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table activity_sessions add column if not exists engagement_id uuid references engagements(id);
alter table timesheet_entries add column if not exists engagement_id uuid references engagements(id);

alter table engagements enable row level security;

-- Shared reference data, same pattern as clients/services/tasks: any
-- authenticated consultant can see engagements (they need to tag their own
-- sessions against one) and read across the whole firm's book of work.
-- Write is manager/admin only — an engagement carries budget/financial
-- data, unlike clients which any consultant can currently create.
drop policy if exists "engagements_authenticated_read" on engagements;
create policy "engagements_authenticated_read" on engagements for select using (auth.role() = 'authenticated');

drop policy if exists "engagements_manager_write" on engagements;
create policy "engagements_manager_write" on engagements for all using (is_manager_or_admin()) with check (is_manager_or_admin());
