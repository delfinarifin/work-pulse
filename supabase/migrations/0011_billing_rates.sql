-- Sprint 11 (expanded scope): billing rates — the missing piece between
-- "minutes logged" and "money", needed for profitability. See
-- docs/ARCHITECTURE_EXPANSION.md item 3. Depends on engagements (0008) and
-- the role system (0007).
--
-- Manager/admin only, full stop — no owner-scoped consultant read. Cost
-- rates in particular are sensitive (they're effectively salary-derived
-- data); bill rates aren't as sensitive but there's no product reason yet
-- for a consultant to see either, so both rate_type values share one
-- table and one access rule for now.

create table if not exists billing_rates (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id),
  client_id uuid references clients(id),
  engagement_id uuid references engagements(id),
  service_id uuid references services(id),
  rate_type text not null check (rate_type in ('bill', 'cost')),
  amount_per_hour numeric not null check (amount_per_hour >= 0),
  effective_from date not null default current_date,
  effective_to date,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table billing_rates enable row level security;

drop policy if exists "billing_rates_manager_all" on billing_rates;
create policy "billing_rates_manager_all" on billing_rates for all using (is_manager_or_admin()) with check (is_manager_or_admin());
