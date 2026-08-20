"use server";

import { revalidatePath } from "next/cache";
import { updateClassificationSettings } from "@/lib/data/classification-settings";
import { updateConsultantRole, setConsultantActive } from "@/lib/data/consultants";
import { createService, updateService } from "@/lib/data/services";
import { createTask, updateTask } from "@/lib/data/tasks";
import { writeAuditLog } from "@/lib/data/audit-logs";
import type { ConsultantRole } from "@/lib/types";

export async function updateSettingsAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const idleThreshold = Number(formData.get("idle_threshold_minutes") ?? 5);
  const autoAccept = Number(formData.get("confidence_auto_accept_threshold") ?? 0.75);
  const confirmThreshold = Number(formData.get("confidence_confirm_threshold") ?? 0.4);
  const minimumCountable = Number(formData.get("minimum_countable_minutes") ?? 5);

  if (!id) return;
  if (!Number.isFinite(idleThreshold) || idleThreshold <= 0) return;
  if (!Number.isFinite(autoAccept) || autoAccept < 0 || autoAccept > 1) return;
  if (!Number.isFinite(confirmThreshold) || confirmThreshold < 0 || confirmThreshold > 1) return;
  if (!Number.isFinite(minimumCountable) || minimumCountable < 0) return;

  await updateClassificationSettings(id, {
    idle_threshold_minutes: idleThreshold,
    confidence_auto_accept_threshold: autoAccept,
    confidence_confirm_threshold: confirmThreshold,
    minimum_countable_minutes: minimumCountable,
  });

  await writeAuditLog({
    action: "settings.update",
    entity: "classification_settings",
    entity_id: id,
    details: {
      idle_threshold_minutes: idleThreshold,
      confidence_auto_accept_threshold: autoAccept,
      confidence_confirm_threshold: confirmThreshold,
      minimum_countable_minutes: minimumCountable,
    },
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

export async function toggleConsultantActiveAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const nextActive = String(formData.get("active") ?? "") === "true";
  if (!id) return;

  // A non-manager/admin caller's update is silently no-op'd at the DB layer
  // (RLS + prevent_role_self_escalation trigger, extended in 0013 to also
  // guard `active`) — this action never needs to check the caller's own
  // role itself.
  await setConsultantActive(id, nextActive);

  await writeAuditLog({
    action: nextActive ? "consultant.activate" : "consultant.deactivate",
    entity: "consultants",
    entity_id: id,
    details: { active: nextActive },
  });

  revalidatePath("/settings");
}

// A non-admin caller's write is rejected at the DB layer
// (services_admin_write / tasks_admin_write RLS policies, 0007) — these
// actions don't need to check the caller's own role themselves.
export async function createServiceAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const defaultWorkTypeId = String(formData.get("default_work_type_id") ?? "").trim() || null;
  if (!name) return;

  await createService(name, defaultWorkTypeId);
  revalidatePath("/settings");
}

export async function updateServiceAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const defaultWorkTypeId = String(formData.get("default_work_type_id") ?? "").trim() || null;
  if (!id || !name) return;

  await updateService(id, name, defaultWorkTypeId);
  revalidatePath("/settings");
}

export async function createTaskAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await createTask(name);
  revalidatePath("/settings");
}

export async function updateTaskAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  await updateTask(id, name);
  revalidatePath("/settings");
}
