# Work Pulse — Test Plan

## Auth Success Scenario (manual)
1. Open app while signed out → redirected to `/login`.
2. Click **Sign up** → fill name, job role, email, password → submit.
3. If email confirmation is off: redirected straight to `/` with a fresh consultant record created for you (`getCurrentConsultant`). If confirmation is on: "Check your email…" message, then sign in after confirming.
4. Visiting `/login` or `/signup` while already signed in → redirected to `/`.
5. Sidebar shows your email + **Sign out**; signing out redirects to `/login` and re-visiting any app route redirects back to `/login`.
6. A second account, signed in separately, sees an empty Dashboard/Activity Log/Timesheets — never the first account's data (owner-scoped RLS).

## v1 Success Scenario (manual, signed in)
1. Sign in → Dashboard loads showing your own consultant hours and work-type breakdown.
2. Navigate to **Activity Log** → verify your own file events with file names, clients, timestamps.
3. Click **Log Activity** → fill form: client, file name `Acme_TaxReturn_2025.xlsx`, start/end time.
4. Submit → activity event is inserted (owned by you), auto-classified (`Tax Filing`), and aggregated into a `timesheet_entries` row for that client + date in the same action.
5. Navigate to **Timesheets** → new entry appears with correct duration and `auto` source.
6. Navigate to **Reports** → totals update for your job role and work type.
7. Edit an entry's work type/duration/notes on Timesheets → source stays visible, audit log records the change.
8. Delete an entry → confirm prompt, row removed, audit log records the before-state.

## Empty State
- Clear all activity_events/timesheet_entries → Dashboard and Activity Log show "No activity data yet. Log your first activity to get started." with a button to `/activities/new`.
- Timesheets page with no entries: "No timesheet entries. Log activities to generate your daily timesheet."
- Reports with no data: "No results for the selected filters. Try a wider date range."

## Error Cases
- Submit activity form with end < start → inline error: "End time must be after start time."
- Submit with empty file name → inline error: "File name is required."
- Sign up with a password under 6 characters → inline error: "Password must be at least 6 characters."
- Sign in with wrong credentials → inline error from Supabase Auth.
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
