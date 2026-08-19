import type {
  Consultant,
  ConsultantCapacity,
  ResourceAllocation,
  TimesheetEntryWithJoins,
} from "@/lib/types";

// A consultant's weekly capacity as of `weekStart` — the row with the
// latest effective_from that still covers the date, same "most recent
// still-active row wins" idea as billing_rates but without the
// scope-narrowing dimension (capacity isn't per-client/engagement).
export function resolveWeeklyCapacity(
  capacities: ConsultantCapacity[],
  consultantId: string,
  weekStart: string,
): number | null {
  const candidates = capacities.filter(
    (c) =>
      c.consultant_id === consultantId &&
      c.effective_from <= weekStart &&
      (!c.effective_to || c.effective_to >= weekStart),
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.effective_from.localeCompare(a.effective_from));
  return candidates[0].weekly_hours;
}

export type CapacityRow = {
  consultantId: string;
  consultantName: string;
  capacityHours: number | null;
  allocatedHours: number;
  actualHours: number;
  overAllocated: boolean;
};

export function computeCapacityReport(
  consultants: Consultant[],
  capacities: ConsultantCapacity[],
  allocations: ResourceAllocation[],
  entries: TimesheetEntryWithJoins[],
  weekStart: string,
  weekEnd: string,
): CapacityRow[] {
  return consultants.map((consultant) => {
    const capacityHours = resolveWeeklyCapacity(capacities, consultant.id, weekStart);

    const allocatedHours = allocations
      .filter((a) => a.consultant_id === consultant.id && a.week_start_date === weekStart)
      .reduce((sum, a) => sum + a.planned_hours, 0);

    const actualMinutes = entries
      .filter((e) => e.consultant_id === consultant.id && e.date >= weekStart && e.date <= weekEnd)
      .reduce((sum, e) => sum + e.duration_minutes, 0);

    return {
      consultantId: consultant.id,
      consultantName: consultant.name,
      capacityHours,
      allocatedHours,
      actualHours: Math.round((actualMinutes / 60) * 10) / 10,
      overAllocated: capacityHours !== null && allocatedHours > capacityHours,
    };
  });
}
