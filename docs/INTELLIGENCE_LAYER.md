# Work Pulse — Intelligence Layer

## Messy Inputs
- Raw file events arrive with inconsistent file names (e.g., `client_A_TaxReturn_2024.xlsx`, `IMG_3421.pdf`).
- Events may overlap or have gaps (consultant switched files mid-task).
- Work type is rarely labeled in the file name.

## Auto-Structure Schema (per event)
```json
{
  "file_name": "Acme_Corp_TaxReturn_2024.xlsx",
  "inferred_client": "Acme Corp",
  "inferred_work_type": "Tax Filing",
  "work_type_confidence": 0.82,
  "work_type_source": "filename-pattern-match",
  "review_status": "unreviewed",
  "duration_minutes": 47
}
```

## Events to Track
- File open / edit / close — `event_type` on `activity_events` (v1's "Log Activity" form always writes `edit`, simulating a completed work block; open/close are reserved for the later real file-watcher agent).
- Idle gap / session merging is a **later** capability — not implemented in v1 (see below).

## Scoring Rules (rule-based v1, `lib/logic/classify.ts` + `lib/logic/aggregation.ts`)
- **Duration calculation:** `ended_at - started_at` in minutes, per event; events without an `ended_at` contribute no duration.
- **Aggregation:** `aggregateActivityEvents` sums duration per consultant + client + work_type + date into one `timesheet_entries` row.
- **Work-type match:** filename keyword match against an in-code table (work_types has no `keywords` column in v2) — first match wins, in priority order: Tax Filing > Tax Planning > Bookkeeping > Payroll > Audit Prep. Confidence 0.80–0.90 per work type.
- **No match:** `work_type_id` = null, confidence 0.30, `review_status` = `unreviewed` — consultant assigns manually on Timesheets.

## What Gets Ranked
- Consultants by total tracked hours (weekly/monthly).
- Work types by time share (where do consultants spend their time).
- Clients by total consultant hours.

## v1 vs Later
- **v1:** Rule-based aggregation + filename heuristics + manual override.
- **Later:** LLM-based work-type classification from file content/metadata; anomaly detection (unusually long sessions); productivity predictions.
