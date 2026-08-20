-- Billing rates can be set in IDR or USD, per explicit request — but every
-- total on /profitability is reported in IDR, so a USD rate needs a
-- USD->IDR exchange rate to convert. Same manager/admin-only, no-consultant-
-- read pattern as billing_rates (0011) — this is the same sensitivity
-- class of data.

alter table billing_rates add column if not exists currency text not null default 'IDR' check (currency in ('IDR', 'USD'));

-- Effective-dated, same resolution pattern as billing_rates/consultant_capacity
-- (most recent effective_from that still covers the date wins) — an old
-- timesheet entry should convert using the rate that was actually in
-- effect then, not today's rate. Only USD needs a row here; IDR is
-- trivially 1:1 with itself.
create table if not exists exchange_rates (
  id uuid primary key default gen_random_uuid(),
  currency text not null check (currency in ('USD')),
  rate_to_idr numeric not null check (rate_to_idr > 0),
  effective_from date not null default current_date,
  effective_to date,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table exchange_rates enable row level security;

drop policy if exists "exchange_rates_manager_all" on exchange_rates;
create policy "exchange_rates_manager_all" on exchange_rates for all using (is_manager_or_admin()) with check (is_manager_or_admin());
