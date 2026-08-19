# Work Pulse — Architecture

## Stack
- **Frontend:** Next.js (App Router, TypeScript, Tailwind)
- **Database:** Supabase (Postgres + RLS)
- **Hosting:** Vercel

## Build Sequencing
- **Now:** Layered classification engine (client/service/task cascade with confidence scoring),
  Confirm/Change/Ignore review flow, learning rules, billable-status tracking, per-consultant
  Settings.
- **Next (separate, deferred plans):** Windows desktop agent (Tauri) for true zero-input
  background capture; manager/admin roles + team dashboards; AI-assisted classification;
  Microsoft Graph/SharePoint integration.

## Key User Action Flow
1. The consultant types a file name on "Log Activity" — `suggestClassification` (a Server
   Action) runs the layered pipeline live, pre-filling client/service/task before they even
   submit.
2. On submit, `logActivity` re-runs `classifySession()`, creates an `activity_sessions` row
   (the human's own picks always win over the auto-suggestion), and triggers same-day
   aggregation into `timesheet_entries` — all in one action.
3. Dashboard and Reports read aggregated entries and render billable/service/consultant
   summaries.
4. On the Activity Log, low-confidence sessions show Confirm / Change / Ignore. **Change**
   corrects the session AND writes a learning rule — the next matching file/folder
   auto-classifies correctly. Sessions can also be merged or deleted, all audit-logged.
5. Settings lets each consultant tune their idle threshold and confidence thresholds, and shows
   their own learned rules and the firm's shared service/task keyword mappings (read-only —
   no admin role yet to edit them from the UI).

## Responsive Nav Shell
Left sidebar (desktop) with: **Dashboard**, **Log Activity**, **Activity Log**, **My
Timesheets**, **Reports**, **Settings**. Collapses to hamburger on mobile.

## Layer Plan
1. **Data layer** (`lib/data/`) — all DB reads/writes; typed query functions per object.
2. **Classification engine** (`lib/classification/`) — the layered client/service/task cascade;
   `classifySession()` is the single entry point, composed of independently-testable layer
   functions plus a shared text-normalization helper (`match.ts`).
3. **App logic** (`lib/logic/`) — pure duration/grouping math (`aggregation.ts`); legacy
   event-based path (`aggregateActivityEvents`) kept working, new session-based path
   (`aggregateActivitySessions`) is what the live app uses.
4. **UI** (`app/`) — server components for data, client components for interactivity.

## AI Classification Layer (added post-launch)
`lib/classification/layers/ai-metadata.ts` is layer 5 of the cascade — a Claude API call (one
combined request for client+service+task, `claude-opus-5`) that runs only when the
deterministic layers (learned rules, file/folder mappings, keyword mappings) leave client,
service, or task still unresolved. Requires `ANTHROPIC_API_KEY`; auto-disables (returns `null`,
same as any other layer with no match) when the key isn't configured — the deterministic
cascade works completely without it, just with lower coverage on ambiguous/non-tax-accounting
work.

Two deliberate product decisions baked into this layer, both explicit user calls, not defaults:
- **The taxonomy is allowed to grow uncontrolled from AI guesses.** If the model can't map work
  to an existing service/task, it proposes a new name and the layer creates that row outright
  (via the service-role client, so it works regardless of whether the triggering caller is an
  admin) — no review queue, no approval gate.
- **Non-tax-accounting work gets classified too, not left blank.** Real consultant time
  includes internal admin, breaks, HR/IT tasks, etc. — the system prompt explicitly instructs
  the model to always resolve to *some* service/task (a generic one if nothing more specific
  fits) and the right `billable_status`, rather than returning null and leaving the session
  unclassified just because it isn't billable client work.

Every returned id is validated against the client/service/task list actually sent to the model
before being trusted — an id the model hallucinates outside that list is discarded, never
silently attached to a session.

## Repo Structure
```
app/
  page.tsx (dashboard)  activities/  activities/new/  timesheets/  reports/  settings/
  login/  signup/  layout.tsx
lib/
  data/            # activity-events.ts (legacy), sessions.ts, timesheets.ts, consultants.ts,
                   # clients.ts, services.ts, tasks.ts, work-types.ts, mappings.ts,
                   # learning-rules.ts, classification-settings.ts, reports.ts, audit-logs.ts
  classification/  # classifySession.ts + layers/ (learned-rules, client-file-mappings,
                   # window-title, ai-metadata, service-task) + match.ts, types.ts
  logic/           # aggregation.ts (event- and session-based)
  supabase/        # client.ts, server.ts, middleware.ts
  types.ts
```

## Module Map
| Module | Responsibility | Owns | Status |
|--------|---------------|------|--------|
| activity-capture | Create sessions from Log Activity | activity_sessions | Live |
| classification | Layered client/service/task cascade + confidence | activity_classifications | Live |
| learning-rules | Remember corrections, auto-apply next time | activity_learning_rules | Live |
| aggregation | Merge sessions into timesheet entries | timesheet_entries | Live |
| review | Confirm/Change/Ignore, merge, delete | activity_sessions.review_status | Live |
| settings | Per-consultant thresholds | classification_settings | Live |
| desktop-agent | Real background file/app detection | devices, idle_periods | Web side live (Sprint: Desktop Agent Milestone 1 — pairing, heartbeat API, service-role client); native Tauri app is Milestone 2, not started |
| roles | consultant/manager/admin, manager read-broadening, admin config write | consultants.role | Live (Sprint 6) |
| ai-classify | LLM-assisted classification fallback (layer 5), grows the taxonomy | activity_classifications | Live once ANTHROPIC_API_KEY is configured |
| graph-integration | M365/SharePoint activity metadata | — | Deferred — needs the firm's Azure AD tenant admin |
| engagements | Bounded client-work unit; tagged on sessions/entries | engagements | Live (Sprint 8) |
| work-journal | Free-text daily notes, optional manager/client visibility | work_journal_entries | Live (Sprint 9) |
| timesheet-approval | Auto-generated draft → submit → approve/reject/reopen | timesheet_submissions | Live (Sprint 10) |
| profitability | Billed vs. cost vs. budget, by engagement/client | billing_rates | Live (Sprint 11) |
| capacity | Weekly capacity vs. planned allocation vs. actual | consultant_capacity, resource_allocations | Live (Sprint 12) |
| recurring-work | Detecting repeated client/task patterns | — | Descoped 2026-08-19 — repetition is normal consultant work, not a signal to flag |
