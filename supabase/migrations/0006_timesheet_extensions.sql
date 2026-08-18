-- Phase 1: extend timesheet_entries with service/task/billable-status/session
-- linkage. work_type_id stays NOT NULL and keeps being populated (bridged via
-- services.default_work_type_id) so existing Reports/WorkTypeBadge/
-- ReportFiltersForm need no changes. Purely additive.

alter table timesheet_entries add column if not exists service_id uuid references services(id);
alter table timesheet_entries add column if not exists task_id uuid references tasks(id);
alter table timesheet_entries add column if not exists billable_status text not null default 'billable'
  check (billable_status in ('billable', 'non_billable', 'internal', 'training', 'administration'));
alter table timesheet_entries add column if not exists session_id uuid references activity_sessions(id);
