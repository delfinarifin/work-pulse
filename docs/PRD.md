# Work Pulse — PRD

## Problem
Consultants manually log time on spreadsheets, losing accuracy and hours. Work Pulse automatically captures file-based activity (documents, design files, code edits) and turns it into timesheet summaries by consultant, job role, and work type.

## Target Users
- **Consultants** — whose activity is auto-captured; they review/approve auto-generated timesheets.
- **Managers** — view workload and time-spent reports across consultants and teams.
- **Admins** — manage job roles, work types, and data-access settings.

## Core Objects
- **Consultant** (name, email, job_role_id, team_id)
- **Team** (name)
- **JobRole** (title)
- **WorkType** (label, category — e.g. "Design", "Documentation", "Development")
- **Activity** (consultant_id, file_name, application, event_type, started_at, ended_at, duration_seconds, work_type_id, project_label) — AI-suggested work_type_id + classification confidence
- **TimesheetEntry** (consultant_id, date, work_type_id, job_role_id, total_minutes, source="auto|manual", status)
- **AuditLog** (actor, action, target_type, target_id, metadata)

## MVP (v1) — Checklist
- [ ] Activity capture: log file-activity events (file name, app, start/end timestamp) via a manual "Log Activity" form (simulating the tracker agent)
- [ ] Auto-classify each activity into a work type using rule-based matching (filename keyword → work type)
- [ ] Roll up activities into daily timesheet entries grouped by work type
- [ ] Dashboard: time spent by consultant, job role, and work type (daily/monthly)
- [ ] Consultant timesheet review screen: approve or edit auto-generated entries
- [ ] Manager report view: filter by consultant, date range, work type
- [ ] Demo data seeded — app renders for anonymous visitors with no login wall

## Non-Goals (v1)
- No mobile app.
- No desktop agent/installer (activity logging is simulated via web form in v1).
- No real-time file-system watcher (pluggable later).
- No SSO / multi-tenant SaaS.
- No payroll or billing calculations.

## Success Criteria
A consultant logs 5 simulated file activities through the web form; the system auto-classifies them into work types, rolls them into a daily timesheet entry, and the manager dashboard shows total minutes by consultant, job role, and work type for that day — all viewable without logging in.