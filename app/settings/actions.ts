"use server";

import { revalidatePath } from "next/cache";
import { updateClassificationSettings } from "@/lib/data/classification-settings";
import { updateConsultantRole } from "@/lib/data/consultants";
import { writeAuditLog } from "@/lib/data/audit-logs";
import type { ConsultantRole } from "@/lib/types";

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

const VALID_ROLES: ConsultantRole[] = ["consultant", "manager", "admin"];

export async function updateConsultantRoleAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "") as ConsultantRole;

  if (!id || !VALID_ROLES.includes(role)) return;

  // A non-admin caller's update is silently no-op'd at the DB layer (RLS +
  // prevent_role_self_escalation trigger) — this action never needs to
  // check the caller's own role itself.
  await updateConsultantRole(id, role);

  await writeAuditLog({
    action: "consultant.role_change",
    entity: "consultants",
    entity_id: id,
    details: { role },
  });

  revalidatePath("/settings");
}
