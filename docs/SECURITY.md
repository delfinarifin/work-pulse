# Work Pulse — Security

## Secret Handling
- Supabase service key stored in server-only environment variables (never prefixed `NEXT_PUBLIC_`).
- Client uses anon key with RLS — never the service key.
- No secrets in frontend bundles, client components, or URLs.

## Permission Model (v1 → end state)
- **v1 (demo):** permissive RLS — all tables readable/writable without login. Seeded demo data renders for anonymous visitors.
- **Lock-down sprint:** replace with owner-scoped policies: `auth.uid() = user_id`. Consultant sees own activities/timesheets. Manager sees team-scoped data. Admin sees all.
- Role hierarchy: admin > manager > consultant. Enforced via RLS policies, not client checks.

## Approved-Tools Rule
- Agent may only invoke named tools listed in the agentic layer.
- No raw SQL execution, no `run_any`, no `send_any`.
- Tool calls are server-side only; client never invokes agent directly.

## Audit Principle
Every meaningful action (classify, rollup, approve, edit, delete) writes an audit_log row with actor, action, target, and metadata. Audit logs are append-only — no update/delete policy in v1 RLS (insert + select only).

## Data Integrity
- Duration stored as integers (seconds/minutes) — no float rounding errors.
- Timesheet entries reference validated work_type_id and job_role_id via FK.
- Classification confidence bounded 0.0–1.0 via check constraint.