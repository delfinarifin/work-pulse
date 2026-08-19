"use server";

import { revalidatePath } from "next/cache";
import { createEngagement, updateEngagement } from "@/lib/data/engagements";
import type { BillingType, EngagementStatus } from "@/lib/types";

const STATUSES: EngagementStatus[] = ["active", "on_hold", "completed", "cancelled"];
const BILLING_TYPES: BillingType[] = ["hourly", "fixed_fee", "retainer"];

export type EngagementFormState = { error: string | null };

// A non-manager/admin caller's write is rejected at the DB layer
// (engagements_manager_write RLS policy) — this action doesn't need to
// check the caller's own role itself.
export async function createEngagementAction(
  _prevState: EngagementFormState,
  formData: FormData,
): Promise<EngagementFormState> {
  const client_id = String(formData.get("client_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const service_id = String(formData.get("service_id") ?? "").trim() || null;
  const engagement_partner_id = String(formData.get("engagement_partner_id") ?? "").trim() || null;
  const manager_id = String(formData.get("manager_id") ?? "").trim() || null;
  const statusRaw = String(formData.get("status") ?? "active");
  const status = STATUSES.includes(statusRaw as EngagementStatus) ? (statusRaw as EngagementStatus) : "active";
  const start_date = String(formData.get("start_date") ?? "").trim() || null;
  const end_date = String(formData.get("end_date") ?? "").trim() || null;
  const target_date = String(formData.get("target_date") ?? "").trim() || null;
  const budgetHoursRaw = String(formData.get("budget_hours") ?? "").trim();
  const budgetAmountRaw = String(formData.get("budget_amount") ?? "").trim();
  const billingTypeRaw = String(formData.get("billing_type") ?? "").trim();
  const billing_type = BILLING_TYPES.includes(billingTypeRaw as BillingType) ? (billingTypeRaw as BillingType) : null;

  if (!client_id) return { error: "Client is required." };
  if (!name) return { error: "Engagement name is required." };

  const budget_hours = budgetHoursRaw ? Number(budgetHoursRaw) : null;
  const budget_amount = budgetAmountRaw ? Number(budgetAmountRaw) : null;
  if (budget_hours !== null && (!Number.isFinite(budget_hours) || budget_hours < 0)) {
    return { error: "Budget hours must be a non-negative number." };
  }
  if (budget_amount !== null && (!Number.isFinite(budget_amount) || budget_amount < 0)) {
    return { error: "Budget amount must be a non-negative number." };
  }

  try {
    await createEngagement({
      client_id,
      service_id,
      name,
      engagement_partner_id,
      manager_id,
      status,
      start_date,
      end_date,
      target_date,
      budget_hours,
      budget_amount,
      billing_type,
    });
  } catch {
    return { error: "Failed to create engagement — only managers/admins can create engagements." };
  }

  revalidatePath("/engagements");
  return { error: null };
}

export async function updateEngagementStatusAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !STATUSES.includes(status as EngagementStatus)) return;

  await updateEngagement(id, { status: status as EngagementStatus });
  revalidatePath("/engagements");
}
