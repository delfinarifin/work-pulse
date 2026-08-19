"use server";

import { revalidatePath } from "next/cache";
import { createConsultantCapacity, createResourceAllocation } from "@/lib/data/capacity";

export type CapacityFormState = { error: string | null };

// A non-manager/admin caller's write is rejected at the DB layer
// (consultant_capacity_manager_all / resource_allocations_manager_all RLS
// policies) — these actions don't need to check the caller's own role.
export async function setCapacityAction(
  _prevState: CapacityFormState,
  formData: FormData,
): Promise<CapacityFormState> {
  const consultant_id = String(formData.get("consultant_id") ?? "").trim();
  const weeklyHoursRaw = String(formData.get("weekly_hours") ?? "").trim();
  const effective_from = String(formData.get("effective_from") ?? "").trim();
  const effective_to = String(formData.get("effective_to") ?? "").trim() || null;

  if (!consultant_id) return { error: "Consultant is required." };
  if (!effective_from) return { error: "Effective-from date is required." };

  const weekly_hours = Number(weeklyHoursRaw);
  if (!Number.isFinite(weekly_hours) || weekly_hours < 0) {
    return { error: "Weekly hours must be a non-negative number." };
  }

  try {
    await createConsultantCapacity({ consultant_id, weekly_hours, effective_from, effective_to });
  } catch {
    return { error: "Failed to save capacity — only managers/admins can set it." };
  }

  revalidatePath("/capacity");
  return { error: null };
}

export async function setAllocationAction(
  _prevState: CapacityFormState,
  formData: FormData,
): Promise<CapacityFormState> {
  const consultant_id = String(formData.get("consultant_id") ?? "").trim();
  const engagement_id = String(formData.get("engagement_id") ?? "").trim();
  const week_start_date = String(formData.get("week_start_date") ?? "").trim();
  const plannedHoursRaw = String(formData.get("planned_hours") ?? "").trim();

  if (!consultant_id) return { error: "Consultant is required." };
  if (!engagement_id) return { error: "Engagement is required." };
  if (!week_start_date) return { error: "Week start date is required." };

  const planned_hours = Number(plannedHoursRaw);
  if (!Number.isFinite(planned_hours) || planned_hours < 0) {
    return { error: "Planned hours must be a non-negative number." };
  }

  try {
    await createResourceAllocation({ consultant_id, engagement_id, week_start_date, planned_hours });
  } catch {
    return { error: "Failed to save allocation — only managers/admins can set it." };
  }

  revalidatePath("/capacity");
  return { error: null };
}
