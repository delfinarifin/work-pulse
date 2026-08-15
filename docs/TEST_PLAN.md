# Work Pulse — Test Plan

## v1 Success Scenario (manual)
1. Open app (no login) → Dashboard loads showing seeded consultant hours and work-type breakdown.
2. Navigate to **Activity Log** → verify seeded file events with file names, clients, timestamps, consultants.
3. Click **Log Activity** → fill form: consultant, client, file name `Acme_TaxReturn_2025.xlsx`, start/end time.
4. Submit → activity event is inserted, auto-classified (`Tax Filing`), and aggregated into a `timesheet_entries` row for that consultant + client + date in the same action.
5. Navigate to **Timesheets** → new entry appears with correct duration and `auto` source.
6. Navigate to **Reports** → totals update for that consultant, job role, and work type.
7. Edit an entry's work type/duration/notes on Timesheets → source stays visible, audit log records the change.
8. Delete an entry → confirm prompt, row removed, audit log records the before-state.

## Empty State
- Clear all activity_events/timesheet_entries → Dashboard and Activity Log show "No activity data yet. Log your first activity to get started." with a button to `/activities/new`.
- Timesheets page with no entries: "No timesheet entries. Log activities to generate your daily timesheet."
- Reports with no data: "No results for the selected filters. Try a wider date range."

## Error Cases
- Submit activity form with end < start → inline error: "End time must be after start time."
- Submit with empty file name → inline error: "File name is required."
- Submit with no consultant selected → inline error: "Consultant is required."
- Network/DB failure on submit → inline error: "Failed to save activity. Check your connection and try again."
- Aggregation for a day with zero activity events → no timesheet entries created (no empty rows).

## Loading States
- Activity list / dashboard / timesheets / reports → skeleton rows or spinner while data loads (`loading.tsx` per route).

## Classification Edge Cases
- Filename with no matching keywords → `work_type_id` = null, displayed as `Unclassified`, confidence = 0.30, `review_status` = `unreviewed`.
- Filename matching multiple keyword sets → first match wins (Tax Filing > Tax Planning > Bookkeeping > Payroll > Audit Prep priority).

## Audit
- Logging an activity writes `audit_logs` with `action='activity.classified'`.
- Auto-aggregation creating new entries writes `audit_logs` with `action='entry.create'`.
- Editing an entry (work type, duration, or notes) writes `audit_logs` with `action='entry.update'` and before/after values.
- Deleting an entry writes `audit_logs` with `action='entry.delete'` and the full before-state.
