# Work Pulse — Security

## Secret Handling
- Supabase service key used ONLY in server-side code / API routes — never in client bundles.
- Frontend uses anon key with RLS; no service key exposure.
- `.env.local` for local dev; Vercel env vars for production.

## Permission Model
- **v1 (demo-first):** Permissive RLS — all tables readable/writable without login so the app renders for anonymous visitors with seed data.
- **Lock-down sprint:** Replace permissive policies with owner-scoped: `auth.uid() = user_id` on consultants, timesheet_entries, audit_logs. Managers get read on all; consultants get write on own entries only; admins get all.
- Agent inherits the calling user's permissions — no privileged escalation.

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
