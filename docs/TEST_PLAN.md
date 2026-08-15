# WorkPulse — Test Plan

## v1 Success Scenario (manual)
1. Open app (no login) → Dashboard loads showing seeded consultant hours and work-type breakdown.
2. Navigate to **Activity Log** → verify 20+ raw file events with file names, timestamps, consultants.
3. `POST /api/activity` with a new file event (consultant_id, file_name, started_at, ended_at).
4. `POST /api/aggregate` for that consultant + date → new `timesheet_entries` row created.
5. Navigate to **Timesheet** → new entry appears with correct duration.
6. Navigate to **Reports** → monthly summary shows updated total for that consultant.
7. Drill into yearly by job role → numbers match monthly sums.

## Empty State
- Clear all timesheet_entries (keep schema) → Dashboard shows "No timesheet data yet. Activity events will appear once consultants start working."
- Reports page: "No data for selected period" with disabled filters.

## Error State
- `POST /api/activity` missing required fields → 400 with field-level error message.
- `POST /api/aggregate` with invalid date range → 400 "Start date must be before end date."
- Database connection fails → all pages show error banner "Unable to load data. Please retry."

## Loading State
- Each page shows skeleton/spinner while data loads.

## Config
- Settings → add new client "Test Client" → appears in client dropdown on Timesheet entry form.
- Delete a work type that has entries → confirm dialog warns entries will lose their work_type_id.

## Audit
- Create a manual entry → check `audit_logs` has row with action='entry.create'.
- Edit entry duration → audit_logs has action='entry.update' with before/after values.
- Delete entry → audit_logs has action='entry.delete' with full before-state.
