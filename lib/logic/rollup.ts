import type { ActivityWithJoins } from "@/lib/types";

export type RollupGroup = {
  consultant_id: string;
  date: string;
  work_type_id: string | null;
  total_minutes: number;
};

// Groups a consultant's activities for one day by work_type into
// timesheet_entries rows. Zero activities → zero groups (no empty rows).
export function rollupActivities(
  activities: ActivityWithJoins[],
  consultantId: string,
  date: string,
): RollupGroup[] {
  const groups = new Map<string, RollupGroup>();

  for (const activity of activities) {
    if (activity.consultant_id !== consultantId) continue;
    if (activity.started_at.slice(0, 10) !== date) continue;

    const key = activity.work_type_id ?? "unclassified";
    const existing = groups.get(key);
    const minutes = Math.round(activity.duration_seconds / 60);

    if (existing) {
      existing.total_minutes += minutes;
    } else {
      groups.set(key, {
        consultant_id: consultantId,
        date,
        work_type_id: activity.work_type_id,
        total_minutes: minutes,
      });
    }
  }

  return Array.from(groups.values());
}
