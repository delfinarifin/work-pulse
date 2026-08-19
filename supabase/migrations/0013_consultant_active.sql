-- Deactivate-not-delete for team members. A hard delete of a consultant
-- was flagged as too risky to build casually — activity_sessions,
-- timesheet_entries, timesheet_submissions, and audit_logs all reference
-- consultant_id with NOT NULL foreign keys and no cascade, so deleting the
-- row would either fail outright or require cascading away someone's
-- entire work/audit history. docs/AGENTIC_LAYER.md already flags "Delete
-- consultant" as critical/human-only for this exact reason. Deactivation
-- is reversible and keeps history intact: an inactive consultant is
-- excluded from pickers and blocked from the app by middleware, but every
-- row they ever touched stays exactly as it was.

alter table consultants add column if not exists active boolean not null default true;

-- No new RLS policy needed — consultants_admin_write (0007) already grants
-- admin update on any consultant row, `active` is just one more column it
-- covers.
--
-- consultants_own_update (0003) WOULD also let a consultant flip their own
-- `active` flag straight back to true after a manager deactivates them —
-- same self-escalation shape as the `role` column. Extend the existing
-- guard trigger (0007's prevent_role_self_escalation) to cover `active`
-- too, rather than adding a second near-identical trigger. Replacing the
-- function body is enough — the trigger object from 0007 already points
-- at this function name, no need to re-create it.
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
    if new.active is distinct from old.active and not is_manager_or_admin() then
      new.active := old.active;
    end if;
  end if;
  return new;
end;
$$;
