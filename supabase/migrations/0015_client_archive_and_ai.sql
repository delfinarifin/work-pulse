-- Client archiving (not delete) — same reasoning as consultants.active
-- (0013): a client is referenced by engagements, activity_sessions,
-- timesheet_entries, billing_rates, client_file_mappings, work_journal_entries,
-- all without cascade, so a hard delete would either fail or wipe real work
-- history. Archiving keeps the row (and every join to it) intact, just
-- excluded from pickers.
--
-- No new RLS policy needed — clients_authenticated_write (0003) already
-- grants full write to any authenticated user on any client row, same
-- permissive pattern as client creation; archiving a client is just
-- another column update under that existing policy.

alter table clients add column if not exists active boolean not null default true;
