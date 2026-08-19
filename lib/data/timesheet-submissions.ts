import { createClient } from "@/lib/supabase/server";
import type { SubmissionStatus, TimesheetSubmissionWithJoins } from "@/lib/types";
import { writeAuditLog } from "@/lib/data/audit-logs";

const SUBMISSION_SELECT =
  "*, consultant:consultants(id, name, job_role), reviewer:consultants!timesheet_submissions_reviewed_by_fkey(id, name)";

export async function listSubmissionsForConsultant(
  consultantId: string,
): Promise<TimesheetSubmissionWithJoins[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timesheet_submissions")
    .select(SUBMISSION_SELECT)
    .eq("consultant_id", consultantId)
    .order("period_start", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as TimesheetSubmissionWithJoins[];
}

// Manager/admin review queue (and general status filter) — RLS
// (timesheet_submissions_manager_read) enforces that only a manager/admin
// caller sees anyone else's rows; a consultant calling this only gets
// their own back.
export async function listSubmissionsByStatus(
  status: SubmissionStatus,
): Promise<TimesheetSubmissionWithJoins[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timesheet_submissions")
    .select(SUBMISSION_SELECT)
    .eq("status", status)
    .order("period_start", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as TimesheetSubmissionWithJoins[];
}

export async function getSubmission(id: string): Promise<TimesheetSubmissionWithJoins | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timesheet_submissions")
    .select(SUBMISSION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as TimesheetSubmissionWithJoins | null;
}

// Finds the existing draft/rejected submission for this exact period, or
// creates a fresh draft. Never returns a submitted/approved/locked one —
// those are done; a new period needs a new submission.
export async function getOrCreateDraftSubmission(
  consultantId: string,
  periodStart: string,
  periodEnd: string,
): Promise<TimesheetSubmissionWithJoins> {
  const supabase = await createClient();
  const { data: existing, error: lookupError } = await supabase
    .from("timesheet_submissions")
    .select(SUBMISSION_SELECT)
    .eq("consultant_id", consultantId)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd)
    .in("status", ["draft", "rejected"])
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing as unknown as TimesheetSubmissionWithJoins;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: created, error: insertError } = await supabase
    .from("timesheet_submissions")
    .insert({
      consultant_id: consultantId,
      period_start: periodStart,
      period_end: periodEnd,
      status: "draft",
      user_id: user?.id ?? null,
    })
    .select(SUBMISSION_SELECT)
    .single();
  if (insertError) throw insertError;
  return created as unknown as TimesheetSubmissionWithJoins;
}

// Rolls every not-yet-submitted entry in the period into this draft — the
// "auto-generation" half: the consultant reviews what's already there
// (aggregated by the classification engine) rather than assembling it by
// hand. Only entries with no submission_id are picked up, so re-running
// this on an already-submitted/approved period touches nothing (those
// entries are locked and excluded by definition).
export async function attachPeriodEntriesToDraft(
  submissionId: string,
  consultantId: string,
  periodStart: string,
  periodEnd: string,
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timesheet_entries")
    .update({ submission_id: submissionId })
    .eq("consultant_id", consultantId)
    .is("submission_id", null)
    .gte("date", periodStart)
    .lte("date", periodEnd)
    .select("id");

  if (error) throw error;
  return (data ?? []).length;
}

export async function submitSubmission(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("timesheet_submissions")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  await writeAuditLog({ action: "timesheet.submit", entity: "timesheet_submissions", entity_id: id });
}

export async function approveSubmission(id: string, reviewerId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("timesheet_submissions")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
    .eq("id", id);
  if (error) throw error;

  await writeAuditLog({ action: "timesheet.approve", entity: "timesheet_submissions", entity_id: id });
}

export async function rejectSubmission(
  id: string,
  reviewerId: string,
  reason: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("timesheet_submissions")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      rejection_reason: reason,
    })
    .eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "timesheet.reject",
    entity: "timesheet_submissions",
    entity_id: id,
    details: { reason },
  });
}

// High-risk per docs/AGENTIC_LAYER.md ("Reopen approved timesheet —
// requires reason in audit log") — reason is required, not optional, and
// always written to the audit log, not just accepted and discarded.
export async function reopenSubmission(
  id: string,
  reviewerId: string,
  reason: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("timesheet_submissions")
    .update({ status: "draft", reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
    .eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "timesheet.reopen",
    entity: "timesheet_submissions",
    entity_id: id,
    details: { reason },
  });
}
