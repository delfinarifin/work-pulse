# Work Pulse — Security

## Secret Handling
- Supabase service key used ONLY in server-side code / API routes — never in client bundles.
- Frontend uses anon key with RLS; no service key exposure.
- `.env.local` for local dev; Vercel env vars for production.

## Permission Model
- **Locked down (current):** Owner-scoped RLS — `auth.uid() = user_id` on `consultants`, `activity_events`, `timesheet_entries`, `audit_logs`. Anonymous visitors are redirected to `/login` by middleware. `clients`/`work_types` stay shared reference data, readable/writable by any authenticated user.
- Agent inherits the calling user's permissions — no privileged escalation.
- **Later:** Manager role with read-across-consultants + approval rights; admin role for config management — no role system yet, everyone is a self-service consultant.

## Approved-Tools Rule
- Only named, server-side functions execute actions (listed in Agentic Layer doc).
- No raw SQL execution from client; all writes go through `lib/data/` typed functions.
- No arbitrary `run_any` / `send_any` patterns.

## Audit Principle
- Every create, update, or delete on timesheet_entries writes to `audit_logs` with before/after state.
- Aggregation runs log count of events processed.
- Audit logs are append-only — no update or delete on `audit_logs`.

## Data Integrity
- Duration must be ≥ 0 (DB check constraint).
- No orphaned entries — `consultant_id` and `work_type_id` are required on timesheet_entries.
- Aggregation is idempotent — re-running on same date range produces same entries.
