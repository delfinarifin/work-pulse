# Work Pulse — Intelligence Layer

## Messy Inputs
Raw file activity: `"Q4_Financial_Report_v3.docx"` in Word, `"Homepage_Hero.fig"` in Figma, `"api-handler.ts"` in VS Code.

## Auto-Structure Schema
```json
{
  "file_name": "Q4_Financial_Report_v3.docx",
  "application": "Word",
  "started_at": "2025-01-15T09:00:00Z",
  "ended_at": "2025-01-15T09:45:00Z",
  "duration_seconds": 2700,
  "classified_work_type": "Documentation",
  "classification_source": "rule-based",
  "classification_confidence": 0.85,
  "review_status": "unreviewed"
}
```

## Events Tracked
- `activity.logged` — new file activity recorded
- `activity.classified` — work type assigned
- `rollup.created` — daily timesheet entry generated
- `timesheet.approved` — consultant approves entry
- `timesheet.edited` — consultant changes work type or duration

## Scoring / Classification Rules (rule-based, v1)
| Keyword(s) in filename | Work Type | Confidence |
|------------------------|-----------|------------|
| report, doc, docx, pdf, spec | Documentation | 0.85 |
| fig, design, mockup, wireframe | Design | 0.80 |
| .ts, .py, .js, api, code, test | Development | 0.90 |
| slide, pptx, deck | Presentation | 0.85 |
| sheet, xlsx, csv, budget | Analysis | 0.80 |
| (no match) | Unclassified | 0.30 |

Roll-up confidence = min of constituent activity confidences.

## What Gets Ranked
- Work types by total time (most-spent-on first).
- Consultants by productivity (total active minutes / day).
- Activities by duration (longest first in review list).

## v1 vs Later
- **v1:** keyword rule engine, confidence scores, review status on every activity.
- **Later:** LLM-based classification with context from project + application; auto-suggest project labels; anomaly detection (unusual activity spikes).