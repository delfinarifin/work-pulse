"use server";

import { revalidatePath } from "next/cache";
import { updateClassificationSettings } from "@/lib/data/classification-settings";
import { writeAuditLog } from "@/lib/data/audit-logs";

export async function updateSettingsAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const idleThreshold = Number(formData.get("idle_threshold_minutes") ?? 5);
  const autoAccept = Number(formData.get("confidence_auto_accept_threshold") ?? 0.75);
  const confirmThreshold = Number(formData.get("confidence_confirm_threshold") ?? 0.4);

  if (!id) return;
  if (!Number.isFinite(idleThreshold) || idleThreshold <= 0) return;
  if (!Number.isFinite(autoAccept) || autoAccept < 0 || autoAccept > 1) return;
  if (!Number.isFinite(confirmThreshold) || confirmThreshold < 0 || confirmThreshold > 1) return;

  await updateClassificationSettings(id, {
    idle_threshold_minutes: idleThreshold,
    confidence_auto_accept_threshold: autoAccept,
    confidence_confirm_threshold: confirmThreshold,
  });

  await writeAuditLog({
    action: "settings.update",
    entity: "classification_settings",
    entity_id: id,
    details: { idle_threshold_minutes: idleThreshold, confidence_auto_accept_threshold: autoAccept, confidence_confirm_threshold: confirmThreshold },
  });

  revalidatePath("/settings");
}
