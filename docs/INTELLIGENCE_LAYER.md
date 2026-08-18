# Work Pulse — Intelligence Layer

## Messy Inputs
- File names arrive inconsistent (e.g., `client_A_TaxReturn_2024.xlsx`, `IMG_3421.pdf`).
- No real file path yet — Phase 1 has no desktop agent, so only the typed file name is
  available (`filePath`/`windowTitle` are always null from the web form). The classification
  engine is built to use them once the agent exists, without any further schema changes.

## Classification Pipeline (`lib/classification/classifySession.ts`)
For each session, three independent cascades run:

**Client** (first match wins, in order):
1. `learned_rule` — the consultant's own past correction (`activity_learning_rules`)
2. `exact_file` — `client_file_mappings` where `pattern_type='exact_file'`
3. `folder_pattern` — `pattern_type='folder_path'`
4. `filename_client_code` — `pattern_type` in (`filename_regex`, `client_code`)
5. `window_title` — fuzzy substring match against `clients.name`/`company_name`
6. `ai_metadata` — scaffolded, disabled (no LLM key configured)

**Service** and **Task** (each independently, 2 layers): `learned_rule` → `keyword_mapping`
against `service_mappings`/`task_mappings`.

Text matching normalizes underscores/hyphens/dots to spaces before comparing (`match.ts`), so a
pattern like "internal meeting" matches a file named `Internal_Meeting_Notes.docx`.

`work_type_id` is bridged from the resolved service's `default_work_type_id` (keeps legacy
Reports/`work_types` working). `billable_status` resolves via `billable_task_rules` (task +
optional client override), defaulting to `billable`.

## Confidence & Confirmation
Per-consultant configurable (`classification_settings`, Settings page):
- **`confidence_auto_accept_threshold`** (default 0.75) — at or above this, the session applies
  silently, no confirmation needed.
- **`confidence_confirm_threshold`** (default 0.40) — below `auto_accept`, the Activity Log
  shows Confirm / Change / Ignore. Overall confidence = the minimum of the client/service/task
  confidences (a session is only as confident as its weakest classification).
- No match on a cascade → confidence 0.30 (matches the original v1 "no match" convention).

## Learning Rules
"Change" on a session does two things: corrects that one session, and calls
`recordCorrection()` (`lib/data/learning-rules.ts`) to derive a pattern — preferring the
containing folder path, falling back to a normalized filename keyword — and upsert an
`activity_learning_rules` row (refreshing `times_applied` on repeat corrections to the same
pattern rather than duplicating). That rule is checked **first** on every subsequent
classification, ahead of the firm-wide mapping tables — a correction takes effect immediately,
with no admin step. "Ignore" excludes the session from aggregation but creates no rule (there's
no correct answer to learn from).

## What Gets Ranked
- Consultants by total tracked/billable minutes.
- Services by time share (where do consultants spend their time).
- Clients by total consultant hours.

## v1 (this phase) vs Later
- **Now:** Rule-based, deterministic cascade + per-consultant learning + manual override —
  fully working without any external AI service.
- **Later:** Real file path/window title from the desktop agent (dramatically improves
  layers 1–4 accuracy); `ai_metadata` layer wired to a real LLM call (metadata only, never file
  contents) once an API key is configured; anomaly detection; productivity predictions.
