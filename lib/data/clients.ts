import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";
import { writeAuditLog } from "@/lib/data/audit-logs";

export async function listClients(): Promise<Client[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Any authenticated consultant can add a client — clients are shared
// firm-wide reference data with authenticated-write RLS (0003), same as
// it's always been; no admin gate here, unlike engagements/services/tasks.
export async function createNewClient(
  name: string,
  companyName: string | null,
): Promise<Client> {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("clients")
    .insert({ name, company_name: companyName, user_id: user?.id ?? null })
    .select("*")
    .single();
  if (error) throw error;

  await writeAuditLog({
    action: "client.create",
    entity: "clients",
    entity_id: data.id,
    details: { name, company_name: companyName },
  });

  return data;
}
