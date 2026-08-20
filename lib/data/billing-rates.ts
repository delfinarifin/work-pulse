import { createClient } from "@/lib/supabase/server";
import type { BillingRateWithJoins, Currency, RateType } from "@/lib/types";
import { writeAuditLog } from "@/lib/data/audit-logs";

const RATE_SELECT =
  "*, consultant:consultants(id, name), client:clients(id, name), engagement:engagements(id, name), service:services(id, name)";

// RLS (billing_rates_manager_all) enforces manager/admin-only on every
// operation here — a non-manager caller's read comes back empty, their
// write is rejected outright.
export async function listBillingRates(): Promise<BillingRateWithJoins[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billing_rates")
    .select(RATE_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as BillingRateWithJoins[];
}

export type NewBillingRate = {
  consultant_id: string;
  client_id: string | null;
  engagement_id: string | null;
  service_id: string | null;
  rate_type: RateType;
  amount_per_hour: number;
  currency: Currency;
  effective_from: string;
  effective_to: string | null;
};

export async function createBillingRate(rate: NewBillingRate): Promise<BillingRateWithJoins> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("billing_rates")
    .insert({ ...rate, user_id: user?.id ?? null })
    .select(RATE_SELECT)
    .single();

  if (error) throw error;
  const created = data as unknown as BillingRateWithJoins;

  await writeAuditLog({
    action: "billing_rate.create",
    entity: "billing_rates",
    entity_id: created.id,
    details: {
      consultant_id: created.consultant_id,
      rate_type: created.rate_type,
      amount_per_hour: created.amount_per_hour,
      currency: created.currency,
    },
  });

  return created;
}
