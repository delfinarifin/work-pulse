"use server";

import { revalidatePath } from "next/cache";
import { getCurrentConsultant } from "@/lib/data/consultants";
import { approveSubmission, rejectSubmission, reopenSubmission } from "@/lib/data/timesheet-submissions";

// A non-manager/admin caller's write is rejected at the DB layer
// (timesheet_submissions_manager_write RLS + enforce_submission_status_transition
// trigger) — these actions don't need to check the caller's own role
// themselves, only that they ARE a consultant (for the reviewer_id).

export async function approveSubmissionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const reviewer = await getCurrentConsultant();
  if (!reviewer) return;

  await approveSubmission(id, reviewer.id);
  revalidatePath("/approvals");
}

export async function rejectSubmissionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id || !reason) return;

  const reviewer = await getCurrentConsultant();
  if (!reviewer) return;

  await rejectSubmission(id, reviewer.id, reason);
  revalidatePath("/approvals");
}

export async function reopenSubmissionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id || !reason) return;

  const reviewer = await getCurrentConsultant();
  if (!reviewer) return;

  await reopenSubmission(id, reviewer.id, reason);
  revalidatePath("/approvals");
}
