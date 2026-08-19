-- Sprint 10 (expanded scope): timesheet auto-generation + approval workflow.
-- docs/AGENTIC_LAYER.md already speced submit_timesheet (high-risk,
-- approval-required) and reopen (manager-only, reasoned) — this migration
-- builds that, plus the "auto-generation" half: rolling up a period's
-- already-aggregated timesheet_entries into a draft submission rather than
-- the consultant assembling one by hand. See
-- docs/ARCHITECTURE_EXPANSION.md item 5. Hard-depends on the role system
-- (0007) — there is no one to approve without a manager.

create table if not exists timesheet_submissions (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id),
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected', 'locked')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references consultants(id),
  rejection_reason text,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table timesheet_entries add column if not exists submission_id uuid references timesheet_submissions(id);

alter table timesheet_submissions enable row level security;

drop policy if exists "timesheet_submissions_own_read" on timesheet_submissions;
create policy "timesheet_submissions_own_read" on timesheet_submissions for select using (auth.uid() = user_id);
drop policy if exists "timesheet_submissions_own_insert" on timesheet_submissions;
create policy "timesheet_submissions_own_insert" on timesheet_submissions for insert with check (auth.uid() = user_id);
drop policy if exists "timesheet_submissions_own_update" on timesheet_submissions;
create policy "timesheet_submissions_own_update" on timesheet_submissions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "timesheet_submissions_manager_read" on timesheet_submissions;
create policy "timesheet_submissions_manager_read" on timesheet_submissions for select using (is_manager_or_admin());
-- Managers need to update OTHER consultants' submissions (approve/reject/
-- reopen) — the owner-scoped policy above only ever covers their own.
drop policy if exists "timesheet_submissions_manager_write" on timesheet_submissions;
create policy "timesheet_submissions_manager_write" on timesheet_submissions for update using (is_manager_or_admin()) with check (is_manager_or_admin());

-- Guard rail: the owner's _own_update policy lets a consultant update every
-- column on their OWN submission (needed for a plain resubmit), but without
-- this trigger they could set status straight to 'approved' themselves.
-- Same pattern as prevent_role_self_escalation (0007): a non-manager caller
-- may only move draft/rejected -> submitted; every other transition
-- (approve, reject, reopen to draft, lock) requires the caller to already
-- be manager/admin.
create or replace function enforce_submission_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and not is_manager_or_admin() then
    if not (old.status in ('draft', 'rejected') and new.status = 'submitted') then
      raise exception 'Only a manager or admin can approve, reject, reopen, or lock a timesheet submission.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists timesheet_submissions_enforce_transition on timesheet_submissions;
create trigger timesheet_submissions_enforce_transition
  before update on timesheet_submissions
  for each row execute function enforce_submission_status_transition();

-- Guard rail: once a timesheet_entries row belongs to a submitted/approved/
-- locked submission, nobody edits or deletes it directly — not even via a
-- bug in the aggregation engine or a future admin tool. The only way to
-- change it is to reopen the submission first (which flips status back to
-- 'draft', at which point this trigger stops blocking). Backstop, not the
-- primary UX — app code should never attempt to touch a locked entry in
-- the first place (see lib/data/timesheets.ts runSessionAggregationForConsultantDate).
create or replace function enforce_entry_immutability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sub_status text;
  target_submission_id uuid;
begin
  target_submission_id := case when tg_op = 'DELETE' then old.submission_id else old.submission_id end;
  if target_submission_id is not null then
    select status into sub_status from timesheet_submissions where id = target_submission_id;
    if sub_status in ('submitted', 'approved', 'locked') then
      raise exception 'Cannot % a timesheet entry that belongs to a % timesheet submission.', lower(tg_op), sub_status;
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists timesheet_entries_enforce_immutability on timesheet_entries;
create trigger timesheet_entries_enforce_immutability
  before update or delete on timesheet_entries
  for each row execute function enforce_entry_immutability();
