# Work Pulse — Agentic Layer

## Draftable Actions (low risk — auto)
- Classify activity → assign work_type_id + confidence. **Auto.**
- Generate daily timesheet entry from activities. **Auto.**
- Tag activity with project_label from filename. **Auto.**

## Executable After Approval (medium risk)
- Consultant edits auto-generated timesheet entry (change work type, adjust duration). **Light approval** — consultant clicks Approve or Edit.
- Reclassify a batch of unclassified activities. **Light approval** — consultant reviews suggested work types.

## Human-Only Actions (high/critical risk)
- Delete an activity record. **Human-only.**
- Delete a timesheet entry. **Human-only.**
- Export data to external system. **Human-only.**
- Modify job roles or work types. **Admin human-only.**

## Named Tools
| Tool | Risk | Trigger |
|------|------|---------|
| `classify_activity` | low | on activity create |
| `rollup_daily` | low | on activity create / cron |
| `flag_unclassified` | low | on rollup if confidence < 0.5 |
| `edit_timesheet_entry` | medium | consultant review |
| `delete_activity` | critical | admin UI only |

## Audit Log Fields
Every action logs: actor, action, target_type, target_id, metadata (jsonb with before/after values), created_at.

## v1 vs Later
- **v1:** `classify_activity` + `rollup_daily` run automatically. Consultant review is manual (no agent).
- **Later:** agent drafts timesheet corrections for low-confidence entries; agent suggests weekly time allocation; agent auto-submits approved timesheets.