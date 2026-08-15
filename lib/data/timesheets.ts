import { createClient } from "@/lib/supabase/server";
import type { TimesheetEntryWithJoins } from "@/lib/types";
import { listActivityEventsForConsultantOnDate } from "@/lib/data/activity-events";
import { writeAuditLog } from "@/lib/data/audit-logs";
import { aggregateActivityEvents } from "@/lib/logic/aggregation";

const ENTRY_SELECT =
  "*, consultant:consultants(id, name, job_role), client:clients(id, name), work_type:work_types(id, name, category)";

export async function listTimesheetEntries(): Promise<
  TimesheetEntryWithJoins[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timesheet_entries")
    .select(ENTRY_SELECT)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as TimesheetEntryWithJoins[];
}

// Recomputes today's-day aggregation for one consultant from their activity
// events and reconciles it against existing timesheet_entries: inserts new
// auto rows, refreshes durations on existing auto rows, and never touches
// manual entries (those are the consultant's own record, not auto-derived).
export async function runAggregationForConsultantDate(
  consultantId: string,
  date: string,
): Promise<void> {
  const supabase = await createClient();

  const [events, existingRes] = await Promise.all([
    listActivityEventsForConsultantOnDate(consultantId, date),
    supabase
      .from("timesheet_entries")
      .select("id, client_id, work_type_id, source")
      .eq("consultant_id", consultantId)
      .eq("date", date),
  ]);

  if (existingRes.error) throw existingRes.error;

  const existingByKey = new Map(
    (existingRes.data ?? []).map((e) => [
      `${e.client_id ?? "none"}:${e.work_type_id ?? "unclassified"}`,
      e,
    ]),
  );

  const groups = aggregateActivityEvents(events, consultantId, date);
  let createdCount = 0;

  for (const group of groups) {
    // timesheet_entries.work_type_id is NOT NULL — unclassified events stay
    // visible on the Activity Log for the consultant to reclassify, but
    // don't roll into a timesheet entry until they have a work type.
    if (!group.work_type_id) continue;

    const key = `${group.client_id ?? "none"}:${group.work_type_id}`;
    const existing = existingByKey.get(key);

    if (!existing) {
      const { error } = await supabase.from("timesheet_entries").insert({
        consultant_id: group.consultant_id,
        client_id: group.client_id,
        work_type_id: group.work_type_id,
        date: group.date,
        duration_minutes: group.duration_minutes,
        source: "auto",
      });
      if (error) throw error;
      createdCount += 1;
    } else if (existing.source === "auto") {
      const { error } = await supabase
        .from("timesheet_entries")
        .update({ duration_minutes: group.duration_minutes })
        .eq("id", existing.id);
      if (error) throw error;
    }
    // manual entries are left untouched — they're not auto-derived.
  }

  if (createdCount > 0) {
    await writeAuditLog({
      action: "entry.create",
      entity: "timesheet_entries",
      entity_id: null,
      details: { consultant_id: consultantId, date, count: createdCount, source: "auto" },
    });
  }
}

export async function editTimesheetEntry(
  id: string,
  changes: { work_type_id?: string; duration_minutes?: number; notes?: string | null },
  before: { work_type_id: string | null; duration_minutes: number; notes: string | null },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("timesheet_entries")
    .update(changes)
    .eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "entry.update",
    entity: "timesheet_entries",
    entity_id: id,
    details: { before, after: changes },
  });
}

export async function deleteTimesheetEntry(
  id: string,
  before: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("timesheet_entries").delete().eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "entry.delete",
    entity: "timesheet_entries",
    entity_id: id,
    details: { before },
  });
}
