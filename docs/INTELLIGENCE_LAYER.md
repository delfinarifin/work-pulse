# WorkPulse — Intelligence Layer

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
- File open → starts activity window
- File edit → confirms active work, extends window
- File close → ends activity window, triggers aggregation
- Idle gap > 10 min → splits into separate entry

## Scoring Rules (rule-based v1)
- **Duration calculation:** `ended_at - started_at`; merge events within 10-min gap on same file.
- **Minimum entry:** discard sessions < 2 minutes (noise).
- **Work-type match score:** filename keyword match → 0.8+; extension heuristic (.xlsx → accounting, .pdf → review) → 0.5; unknown → null, consultant must assign.
- **Productivity score:** total focused minutes / scheduled minutes (v1: 8h baseline) per consultant per day.

## What Gets Ranked
- Consultants by total tracked hours (weekly/monthly).
- Work types by time share (where do consultants spend their time).
- Clients by total consultant hours.

## v1 vs Later
- **v1:** Rule-based aggregation + filename heuristics + manual override.
- **Later:** LLM-based work-type classification from file content/metadata; anomaly detection (unusually long sessions); productivity predictions.
