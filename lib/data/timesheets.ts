import { createClient } from "@/lib/supabase/server";
import type { TimesheetEntryWithJoins } from "@/lib/types";
import { listActivitiesForConsultantOnDate } from "@/lib/data/activities";
import { writeAuditLog } from "@/lib/data/audit-logs";
import { rollupActivities } from "@/lib/logic/rollup";

const ENTRY_SELECT =
  "*, consultant:consultants(id, name), work_type:work_types(id, label, category), job_role:job_roles(id, title)";

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

// Recomputes today's-day rollup for one consultant from their activities and
// reconciles it against existing timesheet_entries: inserts new draft rows,
// refreshes totals on existing drafts, and never touches approved/edited rows.
export async function runRollupForConsultantDate(
  consultantId: string,
  date: string,
): Promise<void> {
  const supabase = await createClient();

  const [activities, consultantRes, existingRes] = await Promise.all([
    listActivitiesForConsultantOnDate(consultantId, date),
    supabase
      .from("consultants")
      .select("job_role_id")
      .eq("id", consultantId)
      .single(),
    supabase
      .from("timesheet_entries")
      .select("id, work_type_id, status")
      .eq("consultant_id", consultantId)
      .eq("date", date),
  ]);

  if (consultantRes.error) throw consultantRes.error;
  if (existingRes.error) throw existingRes.error;

  const jobRoleId = consultantRes.data?.job_role_id ?? null;
  const existingByWorkType = new Map(
    (existingRes.data ?? []).map((e) => [e.work_type_id ?? "unclassified", e]),
  );

  const groups = rollupActivities(activities, consultantId, date);
  let createdCount = 0;

  for (const group of groups) {
    const key = group.work_type_id ?? "unclassified";
    const existing = existingByWorkType.get(key);

    if (!existing) {
      const { error } = await supabase.from("timesheet_entries").insert({
        consultant_id: group.consultant_id,
        date: group.date,
        work_type_id: group.work_type_id,
        job_role_id: jobRoleId,
        total_minutes: group.total_minutes,
        source: "auto",
        status: "draft",
      });
      if (error) throw error;
      createdCount += 1;
    } else if (existing.status === "draft") {
      const { error } = await supabase
        .from("timesheet_entries")
        .update({ total_minutes: group.total_minutes })
        .eq("id", existing.id);
      if (error) throw error;
    }
    // approved/edited entries are left untouched — already reviewed.
  }

  if (createdCount > 0) {
    await writeAuditLog({
      actor: "system",
      action: "rollup.created",
      target_type: "timesheet_entries",
      target_id: null,
      metadata: { consultant_id: consultantId, date, count: createdCount },
    });
  }
}

export async function approveTimesheetEntry(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("timesheet_entries")
    .update({ status: "approved" })
    .eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    actor: "demo-user",
    action: "timesheet.approved",
    target_type: "timesheet_entries",
    target_id: id,
    metadata: {},
  });
}

export async function editTimesheetEntry(
  id: string,
  changes: { work_type_id?: string; total_minutes?: number },
  before: { work_type_id: string | null; total_minutes: number },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("timesheet_entries")
    .update({ ...changes, status: "edited" })
    .eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    actor: "demo-user",
    action: "timesheet.edited",
    target_type: "timesheet_entries",
    target_id: id,
    metadata: { before, after: changes },
  });
}
