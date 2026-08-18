-- Sprint 4: Lock It Down — real Supabase Auth + owner-scoped data.
--
-- activity_events had no user_id column in v2 (0002) — added here.
-- Replaces the permissive "true" RLS policies with ones scoped to
-- auth.uid(). consultants/activity_events/timesheet_entries/audit_logs
-- become private per signed-in user; clients/work_types stay shared
-- reference data readable by any authenticated user.
--
-- Existing seed/demo rows have no owner (user_id is null) and become
-- invisible to everyone once this applies — expected, per CLAUDE.md
-- those rows were always disposable demo placeholders, not real data.

alter table activity_events add column if not exists user_id uuid;

-- consultants: a consultant record IS a signed-in user's identity.
drop policy if exists "consultants_v1_read" on consultants;
drop policy if exists "consultants_v1_write" on consultants;
drop policy if exists "consultants_own_read" on consultants;
create policy "consultants_own_read" on consultants for select using (auth.uid() = user_id);
drop policy if exists "consultants_own_insert" on consultants;
create policy "consultants_own_insert" on consultants for insert with check (auth.uid() = user_id);
drop policy if exists "consultants_own_update" on consultants;
create policy "consultants_own_update" on consultants for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "consultants_own_delete" on consultants;
create policy "consultants_own_delete" on consultants for delete using (auth.uid() = user_id);

-- clients / work_types: shared reference data, not owned by any one user.
drop policy if exists "clients_v1_read" on clients;
drop policy if exists "clients_v1_write" on clients;
drop policy if exists "clients_authenticated_read" on clients;
create policy "clients_authenticated_read" on clients for select using (auth.role() = 'authenticated');
drop policy if exists "clients_authenticated_write" on clients;
create policy "clients_authenticated_write" on clients for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "work_types_v1_read" on work_types;
drop policy if exists "work_types_v1_write" on work_types;
drop policy if exists "work_types_authenticated_read" on work_types;
create policy "work_types_authenticated_read" on work_types for select using (auth.role() = 'authenticated');

-- activity_events: owned via user_id set at insert time.
drop policy if exists "activity_events_v1_read" on activity_events;
drop policy if exists "activity_events_v1_write" on activity_events;
drop policy if exists "activity_events_own_read" on activity_events;
create policy "activity_events_own_read" on activity_events for select using (auth.uid() = user_id);
drop policy if exists "activity_events_own_insert" on activity_events;
create policy "activity_events_own_insert" on activity_events for insert with check (auth.uid() = user_id);
drop policy if exists "activity_events_own_update" on activity_events;
create policy "activity_events_own_update" on activity_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "activity_events_own_delete" on activity_events;
create policy "activity_events_own_delete" on activity_events for delete using (auth.uid() = user_id);

-- timesheet_entries: owned via user_id.
drop policy if exists "timesheet_entries_v1_read" on timesheet_entries;
drop policy if exists "timesheet_entries_v1_write" on timesheet_entries;
drop policy if exists "timesheet_entries_own_read" on timesheet_entries;
create policy "timesheet_entries_own_read" on timesheet_entries for select using (auth.uid() = user_id);
drop policy if exists "timesheet_entries_own_insert" on timesheet_entries;
create policy "timesheet_entries_own_insert" on timesheet_entries for insert with check (auth.uid() = user_id);
drop policy if exists "timesheet_entries_own_update" on timesheet_entries;
create policy "timesheet_entries_own_update" on timesheet_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "timesheet_entries_own_delete" on timesheet_entries;
create policy "timesheet_entries_own_delete" on timesheet_entries for delete using (auth.uid() = user_id);

-- audit_logs: append-only — read/insert your own, no update or delete policy.
drop policy if exists "audit_logs_v1_read" on audit_logs;
drop policy if exists "audit_logs_v1_write" on audit_logs;
drop policy if exists "audit_logs_own_read" on audit_logs;
create policy "audit_logs_own_read" on audit_logs for select using (auth.uid() = user_id);
drop policy if exists "audit_logs_own_insert" on audit_logs;
create policy "audit_logs_own_insert" on audit_logs for insert with check (auth.uid() = user_id);
