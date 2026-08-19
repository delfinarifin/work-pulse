"use server";

import { revalidatePath } from "next/cache";
import { createBillingRate } from "@/lib/data/billing-rates";
import type { RateType } from "@/lib/types";

export type BillingRateFormState = { error: string | null };

const RATE_TYPES: RateType[] = ["bill", "cost"];

// A non-manager/admin caller's write is rejected at the DB layer
// (billing_rates_manager_all RLS policy) — this action doesn't need to
// check the caller's own role itself.
export async function createBillingRateAction(
  _prevState: BillingRateFormState,
  formData: FormData,
): Promise<BillingRateFormState> {
  const consultant_id = String(formData.get("consultant_id") ?? "").trim();
  const rateTypeRaw = String(formData.get("rate_type") ?? "");
  const amountRaw = String(formData.get("amount_per_hour") ?? "").trim();
  const client_id = String(formData.get("client_id") ?? "").trim() || null;
  const engagement_id = String(formData.get("engagement_id") ?? "").trim() || null;
  const service_id = String(formData.get("service_id") ?? "").trim() || null;
  const effective_from = String(formData.get("effective_from") ?? "").trim();
  const effective_to = String(formData.get("effective_to") ?? "").trim() || null;

  if (!consultant_id) return { error: "Consultant is required." };
  if (!RATE_TYPES.includes(rateTypeRaw as RateType)) return { error: "Rate type is required." };
  if (!effective_from) return { error: "Effective-from date is required." };

  const amount_per_hour = Number(amountRaw);
  if (!Number.isFinite(amount_per_hour) || amount_per_hour < 0) {
    return { error: "Amount per hour must be a non-negative number." };
  }

  try {
    await createBillingRate({
      consultant_id,
      client_id,
      engagement_id,
      service_id,
      rate_type: rateTypeRaw as RateType,
      amount_per_hour,
      effective_from,
      effective_to,
    });
  } catch {
    return { error: "Failed to save rate — only managers/admins can set billing rates." };
  }

  revalidatePath("/profitability");
  return { error: null };
}
