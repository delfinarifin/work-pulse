-- Consultant-configurable floor: a session shorter than this many minutes
-- doesn't roll into a timesheet entry — added per explicit request (tiny
-- window-switch blips from the agent shouldn't count as billable/logged
-- time). The session row itself is untouched and still visible on the
-- Activity Log for audit purposes; only aggregation into timesheet_entries
-- skips it. Same lazy-defaults pattern as the other classification_settings
-- columns.

alter table classification_settings add column if not exists minimum_countable_minutes int not null default 5 check (minimum_countable_minutes >= 0);

-- The classification cascade's new deterministic catch-all
-- (lib/classification/classifySession.ts getFallbackServiceTask) resolves
-- to the seeded "Other" service / "Administration" task when nothing else
-- matches. timesheet_entries.work_type_id is NOT NULL, so if "Other" has
-- no default_work_type_id, the fallback would classify the session but it
-- would still be silently excluded from aggregation — defeating the
-- purpose. Guarantee the mapping exists without clobbering it if it's
-- already set to something real.
insert into work_types (name, category)
select 'Administrative', 'accounting'
where not exists (select 1 from work_types where name = 'Administrative');

update services
set default_work_type_id = (select id from work_types where name = 'Administrative')
where name = 'Other' and default_work_type_id is null;
