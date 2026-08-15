"use server";

import { redirect } from "next/navigation";
import { insertActivityEvent } from "@/lib/data/activity-events";
import { writeAuditLog } from "@/lib/data/audit-logs";
import { listWorkTypes } from "@/lib/data/work-types";
import { runAggregationForConsultantDate } from "@/lib/data/timesheets";
import { classifyActivity } from "@/lib/logic/classify";

export type LogActivityState = {
  error: string | null;
};

export async function logActivity(
  _prevState: LogActivityState,
  formData: FormData,
): Promise<LogActivityState> {
  const consultant_id = String(formData.get("consultant_id") ?? "");
  const client_id = String(formData.get("client_id") ?? "").trim();
  const file_name = String(formData.get("file_name") ?? "").trim();
  const started_at = String(formData.get("started_at") ?? "");
  const ended_at = String(formData.get("ended_at") ?? "");

  if (!consultant_id) {
    return { error: "Consultant is required." };
  }
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

  let event;
  try {
    const workTypes = await listWorkTypes();
    const classification = classifyActivity(file_name, workTypes);

    event = await insertActivityEvent({
      consultant_id,
      client_id: client_id || null,
      file_name,
      event_type: "edit",
      started_at: startDate.toISOString(),
      ended_at: endDate.toISOString(),
      work_type_id: classification.work_type_id,
      work_type_source: classification.work_type_source,
      work_type_confidence: classification.work_type_confidence,
    });

    await writeAuditLog({
      action: "activity.classified",
      entity: "activity_events",
      entity_id: event.id,
      details: {
        file_name,
        work_type: classification.work_type_name ?? "Unclassified",
        confidence: classification.work_type_confidence,
      },
    });

    await runAggregationForConsultantDate(
      consultant_id,
      startDate.toISOString().slice(0, 10),
    );
  } catch {
    return { error: "Failed to save activity. Check your connection and try again." };
  }

  redirect("/activities");
}
