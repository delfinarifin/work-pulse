# WorkPulse — Product Requirements

## Problem
Tax and accounting consultants spend hours manually logging timesheets. File-based work (spreadsheets, PDFs, tax software exports) is never captured automatically, leading to inaccurate billing, lost time, and poor resource planning.

## Target User
- **Consultants** — work is auto-tracked; they review and submit timesheets.
- **Managers** — review submitted time, monitor workload, approve entries.
- **Admins** — configure work types, client lists, and access.

## Core Objects
- **Consultant** — name, email, job role (e.g., Tax Senior, Accounting Associate).
- **Client** — the tax/accounting client the work is billed to.
- **Work Type** — categorized activity (e.g., Tax Filing, Bookkeeping, Payroll, Audit Prep).
- **Activity Event** — a raw file interaction (open/edit/close) with start/end timestamps.
- **Timesheet Entry** — aggregated block of time per consultant + client + work type + date, marked auto or manual.
- **Audit Log** — every meaningful action logged.

## MVP (v1)
- [ ] Auto-capture file activity events (simulated file watcher writes events to DB)
- [ ] Aggregate events into daily timesheet entries by consultant/client/work type
- [ ] Edit and manually add timesheet entries
- [ ] Monthly + yearly summary views by consultant, job role, and work type
- [ ] Dashboard with productivity metrics (total hours, top work types, per-consultant breakdown)
- [ ] All screens viewable without login (seeded demo data)

## Non-goals (v1)
- No mobile app
- No real-time desktop agent installation (simulated capture via API/seed)
- No approval workflow (managers view but approval is later)
- No billing/invoicing integration
- No per-user auth or data isolation (deferred to lock-down sprint)

## Success Criteria
A manager opens WorkPulse, sees a dashboard showing Consultant A spent 6.5 hours on Client X doing Tax Filing on Mar 12, drills into the monthly summary, and confirms the yearly roll-up by job role matches the sum of monthly entries — all data derived from auto-captured file events with zero manual entry.
