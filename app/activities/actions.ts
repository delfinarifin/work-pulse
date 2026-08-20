"use server";

import { revalidatePath } from "next/cache";
import { getActivitySession, updateActivitySession, deleteActivitySession } from "@/lib/data/sessions";
import { runSessionAggregationForConsultantDate } from "@/lib/data/timesheets";
import { writeAuditLog } from "@/lib/data/audit-logs";
import { recordCorrection } from "@/lib/data/learning-rules";
import { bridgeWorkTypeId } from "@/lib/classification/classifySession";
import { createClient } from "@/lib/supabase/server";
import type { BillableStatus } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/activities");
  revalidatePath("/timesheets");
  revalidatePath("/");
  revalidatePath("/reports");
}

const BILLABLE_STATUSES: BillableStatus[] = [
  "billable",
  "non_billable",
  "internal",
  "training",
  "administration",
];

export async function changeSessionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const client_id = String(formData.get("client_id") ?? "").trim() || null;
  const service_id = String(formData.get("service_id") ?? "").trim() || null;
  const task_id = String(formData.get("task_id") ?? "").trim() || null;
  const billable_status = String(formData.get("billable_status") ?? "billable");
  if (!id) return;

  const session = await getActivitySession(id);
  if (!session) return;

  const resolvedBillable = BILLABLE_STATUSES.includes(billable_status as BillableStatus)
    ? (billable_status as BillableStatus)
    : "billable";

  // Re-bridge work_type_id for the corrected service — without this, a
  // session that only ever matched a task (no service) stays permanently
  // excluded from timesheet aggregation even after the consultant supplies
  // the missing service via Change.
  const workTypeId =
    service_id === session.service_id
      ? session.work_type_id
      : await bridgeWorkTypeId(await createClient(), service_id);

  await updateActivitySession(id, {
    client_id,
    service_id,
    task_id,
    work_type_id: workTypeId,
    billable_status: resolvedBillable,
    review_status: "changed",
  });

  await writeAuditLog({
    action: "session.correct",
    entity: "activity_sessions",
    entity_id: id,
    details: {
      before: { client_id: session.client_id, service_id: session.service_id, task_id: session.task_id },
      after: { client_id, service_id, task_id, billable_status: resolvedBillable },
    },
  });

  const learningRuleId = await recordCorrection({
    consultantId: session.consultant_id,
    filePath: session.file_path,
    fileName: session.file_name,
    clientId: client_id,
    serviceId: service_id,
    taskId: task_id,
    billableStatus: resolvedBillable,
    sourceSessionId: id,
  });
  if (learningRuleId) {
    await writeAuditLog({
      action: "learning_rule.create",
      entity: "activity_learning_rules",
      entity_id: learningRuleId,
      details: { source_session_id: id },
    });
  }

  await runSessionAggregationForConsultantDate(
    session.consultant_id,
    session.started_at.slice(0, 10),
  );
  revalidateAll();
}

export async function deleteSessionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const session = await getActivitySession(id);
  if (!session) return;

  await deleteActivitySession(id);
  await writeAuditLog({
    action: "session.delete",
    entity: "activity_sessions",
    entity_id: id,
    details: { before: session },
  });
  await runSessionAggregationForConsultantDate(
    session.consultant_id,
    session.started_at.slice(0, 10),
  );
  revalidateAll();
}

// Merges `sourceId` into `targetId`: sums active duration onto the target,
// marks the source as merged (kept for audit lineage, excluded from future
// aggregation since its own row won't be re-summed once merged).
export async function mergeSessionsAction(formData: FormData): Promise<void> {
  const sourceId = String(formData.get("source_id") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  if (!sourceId || !targetId || sourceId === targetId) return;

  const [source, target] = await Promise.all([
    getActivitySession(sourceId),
    getActivitySession(targetId),
  ]);
  if (!source || !target) return;

  await updateActivitySession(targetId, {
    active_duration_minutes: target.active_duration_minutes + source.active_duration_minutes,
  });
  await updateActivitySession(sourceId, { merged_into_session_id: targetId });

  await writeAuditLog({
    action: "session.merge",
    entity: "activity_sessions",
    entity_id: targetId,
    details: { merged_session_id: sourceId, added_minutes: source.active_duration_minutes },
  });

  await runSessionAggregationForConsultantDate(
    target.consultant_id,
    target.started_at.slice(0, 10),
  );
  revalidateAll();
}
