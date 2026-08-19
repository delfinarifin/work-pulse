"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { insertActivitySession } from "@/lib/data/sessions";
import { writeAuditLog } from "@/lib/data/audit-logs";
import { getCurrentConsultant } from "@/lib/data/consultants";
import { runSessionAggregationForConsultantDate } from "@/lib/data/timesheets";
import { classifySession, bridgeWorkTypeId, type ClassifySessionResult } from "@/lib/classification/classifySession";

export type LogActivityState = {
  error: string | null;
};

// Called live from the client as the consultant types a file name (debounced)
// so the form can pre-fill client/service/task before they even submit —
// the concrete, buildable-today expression of "minimize manual input."
export async function suggestClassification(
  fileName: string,
): Promise<ClassifySessionResult | null> {
  if (!fileName.trim()) return null;
  const consultant = await getCurrentConsultant();
  if (!consultant) return null;

  const supabase = await createClient();
  return classifySession(supabase, {
    consultantId: consultant.id,
    fileName,
    filePath: null,
    applicationName: null,
    windowTitle: null,
  });
}

export async function logActivity(
  _prevState: LogActivityState,
  formData: FormData,
): Promise<LogActivityState> {
  const client_id = String(formData.get("client_id") ?? "").trim();
  const engagement_id = String(formData.get("engagement_id") ?? "").trim() || null;
  const service_id = String(formData.get("service_id") ?? "").trim();
  const task_id = String(formData.get("task_id") ?? "").trim();
  const billable_status = String(formData.get("billable_status") ?? "billable");
  const file_name = String(formData.get("file_name") ?? "").trim();
  const started_at = String(formData.get("started_at") ?? "");
  const ended_at = String(formData.get("ended_at") ?? "");

  if (!file_name) {
    return { error: "File name is required." };
  }
  if (!started_at || !ended_at) {
    return { error: "Start and end time are required." };
  }

  const startDate = new Date(started_at);
  const endDate = new Date(ended_at);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Start and end time must be valid." };
  }
  if (endDate <= startDate) {
    return { error: "End time must be after start time." };
  }

  try {
    const consultant = await getCurrentConsultant();
    if (!consultant) {
      return { error: "You must be signed in to log activity." };
    }

    const supabase = await createClient();
    const classification = await classifySession(supabase, {
      consultantId: consultant.id,
      fileName: file_name,
      filePath: null,
      applicationName: null,
      windowTitle: null,
    });

    const activeDurationMinutes = Math.round(
      (endDate.getTime() - startDate.getTime()) / 60000,
    );

    // The consultant's own picks always win over the auto-suggestion —
    // they're either confirming the suggestion or correcting it inline.
    const finalClientId = client_id || classification.clientId;
    const finalServiceId = service_id || classification.serviceId;
    const finalTaskId = task_id || classification.taskId;
    const humanOverrode =
      (!!client_id && client_id !== classification.clientId) ||
      (!!service_id && service_id !== classification.serviceId) ||
      (!!task_id && task_id !== classification.taskId);

    // Re-bridge work_type_id for the FINAL service (the human's pick, if
    // they overrode the suggestion) — reusing classification.workTypeId
    // here would silently point at the wrong (or no) work type.
    const finalWorkTypeId =
      finalServiceId === classification.serviceId
        ? classification.workTypeId
        : await bridgeWorkTypeId(supabase, finalServiceId);

    // High-confidence suggestions the consultant didn't touch are treated as
    // already reviewed — no need to ask them to confirm what they just saw
    // and accepted by submitting. Low-confidence ones still need a
    // Confirm/Change/Ignore pass on the Activity Log.
    const reviewStatus = humanOverrode
      ? "changed"
      : classification.needsConfirmation
        ? "unreviewed"
        : "confirmed";

    const session = await insertActivitySession({
      consultant_id: consultant.id,
      client_id: finalClientId,
      engagement_id,
      service_id: finalServiceId,
      task_id: finalTaskId,
      work_type_id: finalWorkTypeId,
      billable_status:
        (billable_status as typeof classification.billableStatus) ||
        classification.billableStatus,
      file_name,
      started_at: startDate.toISOString(),
      ended_at: endDate.toISOString(),
      active_duration_minutes: activeDurationMinutes,
      classification_method: humanOverrode
        ? "manual"
        : classification.clientMethod ?? classification.serviceMethod ?? "manual",
      classification_confidence: humanOverrode ? 1 : classification.overallConfidence,
      review_status: reviewStatus,
      source: "manual",
    });

    await writeAuditLog({
      action: "session.classify",
      entity: "activity_sessions",
      entity_id: session.id,
      details: {
        file_name,
        client_id: finalClientId,
        engagement_id,
        service_id: finalServiceId,
        task_id: finalTaskId,
        confidence: classification.overallConfidence,
        human_overrode: humanOverrode,
      },
    });

    await runSessionAggregationForConsultantDate(
      consultant.id,
      startDate.toISOString().slice(0, 10),
    );
  } catch {
    return { error: "Failed to save activity. Check your connection and try again." };
  }

  redirect("/activities");
}
