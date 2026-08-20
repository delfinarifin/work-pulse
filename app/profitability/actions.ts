"use server";

import { revalidatePath } from "next/cache";
import { createBillingRate } from "@/lib/data/billing-rates";
import { createExchangeRate } from "@/lib/data/exchange-rates";
import type { Currency, RateType } from "@/lib/types";

export type BillingRateFormState = { error: string | null };

const RATE_TYPES: RateType[] = ["bill", "cost"];
const CURRENCIES: Currency[] = ["IDR", "USD"];

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
  const currencyRaw = String(formData.get("currency") ?? "IDR");

  if (!consultant_id) return { error: "Consultant is required." };
  if (!RATE_TYPES.includes(rateTypeRaw as RateType)) return { error: "Rate type is required." };
  if (!effective_from) return { error: "Effective-from date is required." };
  if (!CURRENCIES.includes(currencyRaw as Currency)) return { error: "Currency is required." };

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
      currency: currencyRaw as Currency,
      effective_from,
      effective_to,
    });
  } catch {
    return { error: "Failed to save rate — only managers/admins can set billing rates." };
  }

  revalidatePath("/profitability");
  return { error: null };
}

export async function createExchangeRateAction(
  _prevState: BillingRateFormState,
  formData: FormData,
): Promise<BillingRateFormState> {
  const rateRaw = String(formData.get("rate_to_idr") ?? "").trim();
  const effective_from = String(formData.get("effective_from") ?? "").trim();
  const effective_to = String(formData.get("effective_to") ?? "").trim() || null;

  if (!effective_from) return { error: "Effective-from date is required." };

  const rate_to_idr = Number(rateRaw);
  if (!Number.isFinite(rate_to_idr) || rate_to_idr <= 0) {
    return { error: "Exchange rate must be a positive number." };
  }

  try {
    await createExchangeRate(rate_to_idr, effective_from, effective_to);
  } catch {
    return { error: "Failed to save exchange rate — only managers/admins can set it." };
  }

  revalidatePath("/profitability");
  return { error: null };
}
