# Work Pulse — Intelligence Layer

## Messy Inputs
Raw file activity: `"SPT_Tahunan_PT_ABC_2024.docx"` in Word, `"Bank_Reconciliation_Nov2024.xlsx"` in Excel, `"Audit_Workpaper_Q4.pdf"` in Adobe Acrobat.

## Auto-Structure Schema
```json
{
  "file_name": "SPT_Tahunan_PT_ABC_2024.docx",
  "application": "Word",
  "started_at": "2025-01-15T09:00:00Z",
  "ended_at": "2025-01-15T09:45:00Z",
  "duration_seconds": 2700,
  "classified_work_type": "Tax Preparation",
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
| tax, spt, pph, ppn, faktur, return, 1040, 1120, w2, 1099 | Tax Preparation | 0.85 |
| ledger, journal, jurnal, reconciliation, recon, gl, coa, buku_besar | Bookkeeping | 0.80 |
| audit, workpaper, wp, fieldwork, engagement, sampling | Audit | 0.90 |
| memo, advisory, planning, opinion, strategy, structuring | Advisory | 0.85 |
| financial_statement, balance_sheet, income_statement, cashflow, budget, forecast, laporan, report | Financial Reporting | 0.80 |
| (no match) | Unclassified | 0.30 |

Roll-up confidence = min of constituent activity confidences.

## What Gets Ranked
- Work types by total time (most-spent-on first).
- Consultants by productivity (total active minutes / day).
- Activities by duration (longest first in review list).

## v1 vs Later
- **v1:** keyword rule engine, confidence scores, review status on every activity.
- **Later:** LLM-based classification with context from project + application; auto-suggest project labels; anomaly detection (unusual activity spikes).