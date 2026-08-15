import type { ActivityEventWithJoins } from "@/lib/types";

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
