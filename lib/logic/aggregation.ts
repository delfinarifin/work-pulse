import type { ActivityEventWithJoins, ActivitySessionWithJoins } from "@/lib/types";

export type AggregationGroup = {
  consultant_id: string;
  client_id: string | null;
  work_type_id: string | null;
  date: string;
  duration_minutes: number;
};

// Groups a consultant's activity events for one day by client + work_type
// into timesheet_entries rows. Events without an ended_at (open windows that
// never closed) contribute no duration. Zero events → zero groups (no empty rows).
export function aggregateActivityEvents(
  events: ActivityEventWithJoins[],
  consultantId: string,
  date: string,
): AggregationGroup[] {
  const groups = new Map<string, AggregationGroup>();

  for (const event of events) {
    if (event.consultant_id !== consultantId) continue;
    if (event.started_at.slice(0, 10) !== date) continue;
    if (!event.ended_at) continue;

    const minutes = Math.round(
      (new Date(event.ended_at).getTime() - new Date(event.started_at).getTime()) / 60000,
    );
    if (minutes <= 0) continue;

    const key = `${event.client_id ?? "none"}:${event.work_type_id ?? "unclassified"}`;
    const existing = groups.get(key);

    if (existing) {
      existing.duration_minutes += minutes;
    } else {
      groups.set(key, {
        consultant_id: consultantId,
        client_id: event.client_id,
        work_type_id: event.work_type_id,
        date,
        duration_minutes: minutes,
      });
    }
  }

  return Array.from(groups.values());
}

export type SessionAggregationGroup = {
  consultant_id: string;
  client_id: string | null;
  engagement_id: string | null;
  service_id: string | null;
  task_id: string | null;
  work_type_id: string | null;
  billable_status: string;
  session_id: string;
  date: string;
  duration_minutes: number;
};

// Groups a consultant's activity sessions for one day by client + service +
// task + billable_status into timesheet_entries rows. Only active_duration_
// minutes counts — idle time never becomes billed/logged time. Sessions
// without a task (still needing confirmation) contribute no duration, same
// spirit as unclassified activity_events today.
export function aggregateActivitySessions(
  sessions: ActivitySessionWithJoins[],
  consultantId: string,
  date: string,
): SessionAggregationGroup[] {
  const groups = new Map<string, SessionAggregationGroup>();

  for (const session of sessions) {
    if (session.consultant_id !== consultantId) continue;
    if (session.started_at.slice(0, 10) !== date) continue;
    if (session.review_status === "ignored") continue;
    if (!session.task_id) continue;
    // timesheet_entries.work_type_id is NOT NULL — a session can have a
    // task_id (task matched) but no work_type_id (no service matched, or
    // the matched service has no default_work_type_id, e.g. "Corporate
    // Services"/"Other"). Skip until it has both; Change lets the
    // consultant supply a service, which re-bridges work_type_id.
    if (!session.work_type_id) continue;
    if (session.active_duration_minutes <= 0) continue;

    const key = `${session.client_id ?? "none"}:${session.engagement_id ?? "none"}:${session.service_id ?? "none"}:${session.task_id}:${session.billable_status}`;
    const existing = groups.get(key);

    if (existing) {
      existing.duration_minutes += session.active_duration_minutes;
    } else {
      groups.set(key, {
        consultant_id: consultantId,
        client_id: session.client_id,
        engagement_id: session.engagement_id,
        service_id: session.service_id,
        task_id: session.task_id,
        work_type_id: session.work_type_id,
        billable_status: session.billable_status,
        session_id: session.id,
        date,
        duration_minutes: session.active_duration_minutes,
      });
    }
  }

  return Array.from(groups.values());
}
