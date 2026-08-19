-- Sprint 12 (expanded scope): capacity planning — consultant availability
-- over time plus a manager's forward allocation plan, compared against
-- actual logged hours. See docs/ARCHITECTURE_EXPANSION.md item 4. Depends
-- on engagements (0008) and the role system (0007); independent of
-- profitability (0011) — the two were built in parallel per the assessment.

create table if not exists consultant_capacity (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id),
  weekly_hours numeric not null check (weekly_hours >= 0),
  effective_from date not null default current_date,
  effective_to date,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists resource_allocations (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id),
  engagement_id uuid not null references engagements(id),
  week_start_date date not null,
  planned_hours numeric not null check (planned_hours >= 0),
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table consultant_capacity enable row level security;
alter table resource_allocations enable row level security;

-- Unlike billing_rates, capacity/allocation isn't cost-sensitive — a
-- consultant sees their own capacity and allocations (not a manager's
-- write, but useful for the consultant to know their own plan), on top of
-- manager/admin seeing and writing everyone's. The self-read check goes
-- through consultants.user_id rather than a user_id column on these
-- tables, since the row's own user_id is whoever CREATED it (usually a
-- manager), not necessarily the consultant it's about.
drop policy if exists "consultant_capacity_self_read" on consultant_capacity;
create policy "consultant_capacity_self_read" on consultant_capacity for select using (
  consultant_id in (select id from consultants where user_id = auth.uid())
);
drop policy if exists "consultant_capacity_manager_all" on consultant_capacity;
create policy "consultant_capacity_manager_all" on consultant_capacity for all using (is_manager_or_admin()) with check (is_manager_or_admin());

drop policy if exists "resource_allocations_self_read" on resource_allocations;
create policy "resource_allocations_self_read" on resource_allocations for select using (
  consultant_id in (select id from consultants where user_id = auth.uid())
);
drop policy if exists "resource_allocations_manager_all" on resource_allocations;
create policy "resource_allocations_manager_all" on resource_allocations for all using (is_manager_or_admin()) with check (is_manager_or_admin());
