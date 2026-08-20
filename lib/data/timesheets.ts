import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { BillableStatus, TimesheetEntryWithJoins } from "@/lib/types";
import { listActivityEventsForConsultantOnDate } from "@/lib/data/activity-events";
import { listActivitySessionsForConsultantOnDate } from "@/lib/data/sessions";
import { writeAuditLog } from "@/lib/data/audit-logs";
import { aggregateActivityEvents, aggregateActivitySessions } from "@/lib/logic/aggregation";

const ENTRY_SELECT =
  "*, consultant:consultants(id, name, job_role), client:clients(id, name), engagement:engagements(id, name), work_type:work_types(id, name, category), service:services(id, name), task:tasks(id, name), submission:timesheet_submissions(id, status)";

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

// Legacy path (pre-classification-engine): recomputes a day's aggregation
// from activity_events. Kept working unchanged for anything still on that
// path; the new "Log Activity" flow uses runSessionAggregationForConsultantDate.
export async function runAggregationForConsultantDate(
  consultantId: string,
  date: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        user_id: user?.id ?? null,
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

// Reconciles a day's activity_sessions into timesheet_entries: inserts new
// auto rows keyed by client+service+task+billable_status, refreshes duration
// on existing auto rows, never touches manual rows. Sessions still awaiting
// confirmation (no task_id, or review_status='ignored') contribute nothing —
// see aggregateActivitySessions.
// Accepts an optional injected client + user_id, same reason as
// listActivitySessionsForConsultantOnDate — the agent API routes have no
// cookie session to derive `user` from, so they pass both explicitly.
export async function runSessionAggregationForConsultantDate(
  consultantId: string,
  date: string,
  client?: SupabaseClient,
  userId?: string | null,
): Promise<void> {
  const supabase = client ?? (await createClient());
  const user: { id: string | null } = client
    ? { id: userId ?? null }
    : { id: (await supabase.auth.getUser()).data.user?.id ?? null };

  const [sessions, existingRes, settingsRes] = await Promise.all([
    listActivitySessionsForConsultantOnDate(consultantId, date, supabase),
    supabase
      .from("timesheet_entries")
      .select("id, client_id, engagement_id, service_id, task_id, billable_status, source, submission_id")
      .eq("consultant_id", consultantId)
      .eq("date", date),
    supabase
      .from("classification_settings")
      .select("minimum_countable_minutes")
      .eq("consultant_id", consultantId)
      .maybeSingle(),
  ]);

  if (existingRes.error) throw existingRes.error;

  const existingByKey = new Map(
    (existingRes.data ?? []).map((e) => [
      `${e.client_id ?? "none"}:${e.engagement_id ?? "none"}:${e.service_id ?? "none"}:${e.task_id}:${e.billable_status}`,
      e,
    ]),
  );

  const minimumCountableMinutes = settingsRes.data?.minimum_countable_minutes ?? 5;
  const groups = aggregateActivitySessions(sessions, consultantId, date, minimumCountableMinutes);
  const groupKeys = new Set(
    groups.map((g) => `${g.client_id ?? "none"}:${g.engagement_id ?? "none"}:${g.service_id ?? "none"}:${g.task_id}:${g.billable_status}`),
  );
  let createdCount = 0;

  // An existing auto entry whose key no longer has any backing session
  // (the session that created it was ignored, deleted, or merged away) is
  // now orphaned — remove it rather than leaving stale billable minutes.
  // Skip anything already attached to a submission: it's locked (enforced
  // by the enforce_entry_immutability trigger too — this check just avoids
  // hitting that trigger from normal aggregation), stays frozen until the
  // submission is reopened.
  for (const [key, existing] of existingByKey) {
    if (existing.source === "auto" && !existing.submission_id && !groupKeys.has(key)) {
      const { error } = await supabase.from("timesheet_entries").delete().eq("id", existing.id);
      if (error) throw error;
    }
  }

  for (const group of groups) {
    const key = `${group.client_id ?? "none"}:${group.engagement_id ?? "none"}:${group.service_id ?? "none"}:${group.task_id}:${group.billable_status}`;
    const existing = existingByKey.get(key);

    if (existing?.submission_id) {
      // Locked into a submitted/approved timesheet — further activity on
      // this date doesn't retroactively change what was submitted.
      continue;
    }

    if (!existing) {
      const { error } = await supabase.from("timesheet_entries").insert({
        consultant_id: group.consultant_id,
        client_id: group.client_id,
        engagement_id: group.engagement_id,
        service_id: group.service_id,
        task_id: group.task_id,
        work_type_id: group.work_type_id,
        billable_status: group.billable_status,
        session_id: group.session_id,
        date: group.date,
        duration_minutes: group.duration_minutes,
        source: "auto",
        user_id: user?.id ?? null,
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
  changes: Partial<{
    work_type_id: string;
    engagement_id: string | null;
    service_id: string | null;
    task_id: string | null;
    billable_status: BillableStatus;
    duration_minutes: number;
    notes: string | null;
  }>,
  before: Record<string, unknown>,
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
