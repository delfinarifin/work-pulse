# Work Pulse — Product Requirements

## Problem
Tax and accounting consultants spend hours manually logging timesheets. File-based work (spreadsheets, PDFs, tax software exports) is never captured automatically, leading to inaccurate billing, lost time, and poor resource planning.

## Target User
- **Consultants** — work is auto-tracked; they review and submit timesheets.
- **Managers** — review submitted time, monitor workload, approve entries.
- **Admins** — configure work types, client lists, and access.

## Guiding principle
Consultants should focus on their work while Work Pulse automatically captures and organizes
their activities. Minimize manual input; when the system isn't confident, ask a single simple
question ("We detected X – Y – Z. Is this correct?") rather than demanding the consultant
re-enter everything by hand.

## Core Objects
- **Consultant** — name, email, job role (e.g., Tax Senior, Accounting Associate). Their own
  identity in the app, created on first sign-in.
- **Client** — the tax/accounting client the work is billed to.
- **Service** — the practice area (Tax Compliance, Tax Advisory, Tax Audit Assistance, Transfer
  Pricing, Accounting, Bookkeeping, Corporate Services, Tax Dispute/Objection, Tax Investigation,
  Other).
- **Task** — the specific unit of work within a service (CIT Computation, Tax Return
  Preparation/Review, PPh/VAT Calculation, Bank Reconciliation, Tax Research, Tax Advisory,
  Transfer Pricing Documentation, Financial Statement Preparation, Bookkeeping, Client/Internal
  Meeting, Email/Correspondence, Administration).
- **Activity Session** — one block of work: file, client, service, task, billable status,
  duration, and how confident the classification is.
- **Timesheet Entry** — aggregated block of time per consultant + client + service + task +
  billable status + date, marked auto or manual.
- **Learning Rule** — a consultant's correction remembered so the same file/folder pattern
  auto-classifies correctly next time.
- **Device** — a paired desktop-agent install (schema-ready; no agent yet — see Non-goals).
- **Audit Log** — every meaningful action logged.

## MVP (v1) — done
- [x] Auto-capture activity via the "Log Activity" form, with live client/service/task
  suggestions as the consultant types the file name
- [x] Layered classification cascade (learned rule → exact file → folder pattern → filename/
  client code → window title → keyword mapping), each attempt confidence-scored
- [x] Confirm / Change / Ignore on low-confidence classifications; Change teaches a learning rule
- [x] Aggregate sessions into daily timesheet entries by consultant/client/service/task/billable
  status
- [x] Edit, merge, and delete timesheet entries and activity sessions, all audit-logged
- [x] Billable / Non-billable / Internal / Training / Administration classification, with
  configurable default rules per task
- [x] Dashboard, Timesheets, and Reports showing service/billable breakdowns
- [x] Per-consultant configurable idle threshold and confidence thresholds (Settings page)
- [x] Real auth — every consultant's data is private to them (no demo/no-login mode anymore)

## Non-goals (this phase)
- No native desktop agent yet — automatic capture today means the consultant types the file
  name once and the system classifies it; true zero-input background capture needs the agent
  (separate, deferred plan — this sandbox can't build/test a native Windows binary)
- No manager/admin roles or team-wide dashboards yet (no role system exists)
- No AI-assisted classification (needs an LLM API key, not yet configured)
- No Microsoft Graph/SharePoint integration (needs the firm's Azure AD tenant admin)
- No approval workflow (managers reviewing/approving submitted timesheets)
- No billing/invoicing integration
- No mobile app

## Success Criteria
A consultant signs in, types a file name on Log Activity, and Work Pulse suggests the client,
service, and task with a confidence score — confirmed instantly if confidence is high, or a
one-click Confirm/Change/Ignore if not. A correction is remembered, so the next matching file
classifies itself. Their Dashboard, Timesheets, and Reports show accurate billable/non-billable
breakdowns with zero re-typing — all data private to that consultant.
