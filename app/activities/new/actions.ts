"use server";

import { redirect } from "next/navigation";
import { insertActivity } from "@/lib/data/activities";
import { writeAuditLog } from "@/lib/data/audit-logs";
import { listWorkTypes } from "@/lib/data/work-types";
import { runRollupForConsultantDate } from "@/lib/data/timesheets";
import { classifyActivity } from "@/lib/logic/classify";

export type LogActivityState = {
  error: string | null;
};

export async function logActivity(
  _prevState: LogActivityState,
  formData: FormData,
): Promise<LogActivityState> {
  const consultant_id = String(formData.get("consultant_id") ?? "");
  const file_name = String(formData.get("file_name") ?? "").trim();
  const application = String(formData.get("application") ?? "").trim();
  const started_at = String(formData.get("started_at") ?? "");
  const ended_at = String(formData.get("ended_at") ?? "");
  const project_label = String(formData.get("project_label") ?? "").trim();

  if (!consultant_id) {
    return { error: "Consultant is required." };
  }
  if (!file_name) {
    return { error: "File name is required." };
  }
  if (!application) {
    return { error: "Application is required." };
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

  const duration_seconds = Math.round(
    (endDate.getTime() - startDate.getTime()) / 1000,
  );

  let activity;
  try {
    const workTypes = await listWorkTypes();
    const classification = classifyActivity(file_name, workTypes);

    activity = await insertActivity({
      consultant_id,
      file_name,
      application,
      started_at: startDate.toISOString(),
      ended_at: endDate.toISOString(),
      duration_seconds,
      work_type_id: classification.work_type_id,
      work_type_value: classification.work_type_value,
      work_type_source: classification.work_type_source,
      work_type_confidence: classification.work_type_confidence,
      project_label: project_label || null,
    });

    await writeAuditLog({
      actor: "demo-user",
      action: "activity.classified",
      target_type: "activities",
      target_id: activity.id,
      metadata: {
        file_name,
        work_type: classification.work_type_value,
        confidence: classification.work_type_confidence,
      },
    });

    await runRollupForConsultantDate(
      consultant_id,
      startDate.toISOString().slice(0, 10),
    );
  } catch {
    return { error: "Failed to save activity. Check your connection and try again." };
  }

  redirect("/activities");
}
