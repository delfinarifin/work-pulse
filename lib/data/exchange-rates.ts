import { createClient } from "@/lib/supabase/server";
import type { ExchangeRate } from "@/lib/types";
import { writeAuditLog } from "@/lib/data/audit-logs";

// RLS (exchange_rates_manager_all) enforces manager/admin-only — a
// non-manager caller's read comes back empty, their write is rejected.
export async function listExchangeRates(): Promise<ExchangeRate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exchange_rates")
    .select("*")
    .order("effective_from", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createExchangeRate(
  rateToIdr: number,
  effectiveFrom: string,
  effectiveTo: string | null,
): Promise<ExchangeRate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("exchange_rates")
    .insert({
      currency: "USD",
      rate_to_idr: rateToIdr,
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      user_id: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  await writeAuditLog({
    action: "exchange_rate.create",
    entity: "exchange_rates",
    entity_id: data.id,
    details: { rate_to_idr: rateToIdr, effective_from: effectiveFrom },
  });

  return data;
}
