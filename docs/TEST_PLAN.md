# Work Pulse — Test Plan

## v1 Success Scenario (manual)
1. Open app (no login) → dashboard renders with seeded demo data.
2. Click **Log Activity** in sidebar.
3. Fill form: file name `Q4_Budget_Analysis.xlsx`, application `Excel`, start 09:00, end 10:30.
4. Submit → redirect to activity list → new activity shows work type `Analysis`, confidence `0.80`.
5. Log 2 more activities: `Homepage_Mockup.fig` (Figma, 30 min) → `Design`; `api-routes.ts` (VS Code, 45 min) → `Development`.
6. Go to **Timesheets** → see 3 daily entries (one per work type) for today.
7. Click **Approve** on the Design entry → status changes to `approved`; audit log written.
8. Click **Edit** on the Development entry → change duration to 60 min → save → status = `edited`.
9. Go to **Dashboard** → bar chart shows minutes by work type; table shows per-consultant totals.
10. Go to **Reports** → filter by today → see breakdown by consultant, job role, work type.

## Empty State
- Clear all activities → dashboard shows: "No activity data yet. Log your first activity to get started." with a button to `/activities/new`.
- Timesheets page with no entries: "No timesheet entries. Log activities to generate your daily timesheet."
- Reports with no data: "No results for the selected filters. Try a wider date range."

## Error Cases
- Submit activity form with end < start → inline error: "End time must be after start time."
- Submit with empty file name → inline error: "File name is required."
- Network failure on submit → toast: "Failed to save activity. Check your connection and try again."
- Rollup with zero activities for the day → no timesheet entries created (no empty rows).

## Loading States
- Activity list → skeleton rows for 2 seconds (simulated delay).
- Dashboard charts → spinner with "Loading time data…".
- Timesheet table → pulsing row placeholders.

## Classification Edge Cases
- Filename with no matching keywords → work type = `Unclassified`, confidence = 0.30, review_status = `unreviewed`.
- Filename matching multiple keyword sets → first match wins (Documentation > Design > Development priority).