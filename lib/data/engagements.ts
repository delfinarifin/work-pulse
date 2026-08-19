import { createClient } from "@/lib/supabase/server";
import type { EngagementStatus, EngagementWithJoins, BillingType } from "@/lib/types";
import { writeAuditLog } from "@/lib/data/audit-logs";

const ENGAGEMENT_SELECT =
  "*, client:clients(id, name), service:services(id, name), engagement_partner:consultants!engagements_engagement_partner_id_fkey(id, name), manager:consultants!engagements_manager_id_fkey(id, name)";

export async function listEngagements(): Promise<EngagementWithJoins[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("engagements")
    .select(ENGAGEMENT_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as EngagementWithJoins[];
}

export async function listEngagementsForClient(clientId: string): Promise<EngagementWithJoins[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("engagements")
    .select(ENGAGEMENT_SELECT)
    .eq("client_id", clientId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as EngagementWithJoins[];
}

export async function getEngagement(id: string): Promise<EngagementWithJoins | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("engagements")
    .select(ENGAGEMENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as EngagementWithJoins | null;
}

export type NewEngagement = {
  client_id: string;
  service_id: string | null;
  name: string;
  engagement_partner_id: string | null;
  manager_id: string | null;
  status: EngagementStatus;
  start_date: string | null;
  end_date: string | null;
  target_date: string | null;
  budget_hours: number | null;
  budget_amount: number | null;
  billing_type: BillingType | null;
};

// Only succeeds for a caller whose role is manager/admin — enforced by RLS
// (engagements_manager_write), not by this function.
export async function createEngagement(engagement: NewEngagement): Promise<EngagementWithJoins> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("engagements")
    .insert({ ...engagement, user_id: user?.id ?? null })
    .select(ENGAGEMENT_SELECT)
    .single();

  if (error) throw error;
  const created = data as unknown as EngagementWithJoins;

  await writeAuditLog({
    action: "engagement.create",
    entity: "engagements",
    entity_id: created.id,
    details: { name: created.name, client_id: created.client_id },
  });

  return created;
}

export async function updateEngagement(
  id: string,
  changes: Partial<NewEngagement>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("engagements").update(changes).eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "engagement.update",
    entity: "engagements",
    entity_id: id,
    details: { after: changes },
  });
}
