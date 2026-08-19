-- Sprint 6 (expanded scope): role system. Foundational for profitability,
-- capacity planning, approval workflow, and engagement ownership — none of
-- those can distinguish "my own data" from "my team's data" without this.
--
-- Single-firm, single-tenant: every authenticated user is a consultant at
-- the same firm (this matches the existing pattern where clients/services/
-- tasks are shared reference data readable by any authenticated user, not
-- scoped per user). No firm_id/tenant column — see
-- docs/ARCHITECTURE_EXPANSION.md for why that's a deliberate choice, not an
-- oversight.
--
-- This migration only ADDS read visibility for managers/admins on top of
-- the existing owner-scoped policies from 0003-0006 — it never narrows what
-- a consultant can already see of their own data. Write access beyond "my
-- own rows" is deliberately NOT granted here; each later feature (approval
-- workflow, resource allocation, etc.) adds the specific write policy it
-- needs, scoped to what that feature actually does.

alter table consultants add column if not exists role text not null default 'consultant'
  check (role in ('consultant', 'manager', 'admin'));

-- SECURITY DEFINER so policies on other tables can check "is the current
-- user a manager/admin" without re-entering RLS on consultants (which would
-- recurse back into this same check).
create or replace function current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from consultants where user_id = auth.uid() limit 1;
$$;

create or replace function is_manager_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(current_user_role() in ('manager', 'admin'), false);
$$;

-- consultants: managers/admins can see the whole roster (needed for team
-- dashboards, assigning engagement owners, approval-workflow reviewer
-- pickers). Additive to consultants_own_read.
drop policy if exists "consultants_manager_read" on consultants;
create policy "consultants_manager_read" on consultants for select using (is_manager_or_admin());

-- Admins can update any consultant row (needed to promote/demote roles and
-- fix another consultant's profile). Additive to consultants_own_update,
-- which stays scoped to the caller's own row.
drop policy if exists "consultants_admin_write" on consultants;
create policy "consultants_admin_write" on consultants for update using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

-- Guard rail: consultants_own_update permits a caller to update every
-- column on their OWN row, including the new `role` column — without this
-- trigger, any consultant could grant themselves admin. Only an actor who
-- is already admin may change a role value (their own or someone else's);
-- everyone else's attempted role change is silently discarded, leaving
-- every other field in the same update to go through normally.
create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.role is distinct from 'consultant' and current_user_role() is distinct from 'admin' then
      new.role := 'consultant';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.role is distinct from old.role and current_user_role() is distinct from 'admin' then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists consultants_prevent_role_self_escalation on consultants;
create trigger consultants_prevent_role_self_escalation
  before insert or update on consultants
  for each row execute function prevent_role_self_escalation();

-- Bootstrapping: the very first admin cannot be created through the app
-- (nobody has admin rights yet to grant it). One-time step, run once by
-- whoever owns the Supabase project, in the SQL editor.
--
-- IMPORTANT: the SQL editor runs with no auth.uid() (no logged-in
-- session), so current_user_role() there returns null and the trigger
-- above silently reverts the role change back to whatever it was — RLS is
-- bypassed by the SQL editor's postgres role, but the trigger fires
-- regardless of RLS, so it isn't. The bootstrap UPDATE must temporarily
-- disable the trigger:
--   alter table consultants disable trigger consultants_prevent_role_self_escalation;
--   update consultants set role = 'admin' where email = 'the-first-admin@example.com';
--   alter table consultants enable trigger consultants_prevent_role_self_escalation;
-- A plain UPDATE with the trigger left enabled will report "1 row
-- affected" but silently no-op the role column — always verify with a
-- SELECT afterward.

-- Broaden read (only) on every owner-scoped operational table so a manager/
-- admin can see the whole team's activity, not just their own. Additive to
-- each table's existing *_own_read policy.
drop policy if exists "activity_events_manager_read" on activity_events;
create policy "activity_events_manager_read" on activity_events for select using (is_manager_or_admin());

drop policy if exists "timesheet_entries_manager_read" on timesheet_entries;
create policy "timesheet_entries_manager_read" on timesheet_entries for select using (is_manager_or_admin());

drop policy if exists "audit_logs_manager_read" on audit_logs;
create policy "audit_logs_manager_read" on audit_logs for select using (is_manager_or_admin());

drop policy if exists "devices_manager_read" on devices;
create policy "devices_manager_read" on devices for select using (is_manager_or_admin());

drop policy if exists "activity_sessions_manager_read" on activity_sessions;
create policy "activity_sessions_manager_read" on activity_sessions for select using (is_manager_or_admin());

drop policy if exists "idle_periods_manager_read" on idle_periods;
create policy "idle_periods_manager_read" on idle_periods for select using (is_manager_or_admin());

drop policy if exists "activity_classifications_manager_read" on activity_classifications;
create policy "activity_classifications_manager_read" on activity_classifications for select using (is_manager_or_admin());

drop policy if exists "activity_learning_rules_manager_read" on activity_learning_rules;
create policy "activity_learning_rules_manager_read" on activity_learning_rules for select using (is_manager_or_admin());

drop policy if exists "classification_settings_manager_read" on classification_settings;
create policy "classification_settings_manager_read" on classification_settings for select using (is_manager_or_admin());

-- services/tasks/mappings/rules are already authenticated-read for everyone
-- (no change needed) but now admins specifically can write them — the gap
-- called out in 0005/0006 ("no admin role yet to gate write access").
drop policy if exists "services_admin_write" on services;
create policy "services_admin_write" on services for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

drop policy if exists "tasks_admin_write" on tasks;
create policy "tasks_admin_write" on tasks for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

drop policy if exists "service_mappings_admin_write" on service_mappings;
create policy "service_mappings_admin_write" on service_mappings for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

drop policy if exists "task_mappings_admin_write" on task_mappings;
create policy "task_mappings_admin_write" on task_mappings for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

drop policy if exists "client_file_mappings_admin_write" on client_file_mappings;
create policy "client_file_mappings_admin_write" on client_file_mappings for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

drop policy if exists "billable_task_rules_admin_write" on billable_task_rules;
create policy "billable_task_rules_admin_write" on billable_task_rules for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');

drop policy if exists "work_types_admin_write" on work_types;
create policy "work_types_admin_write" on work_types for all using (current_user_role() = 'admin') with check (current_user_role() = 'admin');
