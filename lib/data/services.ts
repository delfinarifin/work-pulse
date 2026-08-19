import { createClient } from "@/lib/supabase/server";
import type { Service } from "@/lib/types";
import { writeAuditLog } from "@/lib/data/audit-logs";

export async function listServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Only succeeds for a caller whose role is admin — enforced by RLS
// (services_admin_write, 0007), not by this function.
export async function createService(
  name: string,
  defaultWorkTypeId: string | null,
): Promise<Service> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .insert({ name, default_work_type_id: defaultWorkTypeId })
    .select("*")
    .single();
  if (error) throw error;

  await writeAuditLog({
    action: "service.create",
    entity: "services",
    entity_id: data.id,
    details: { name, default_work_type_id: defaultWorkTypeId },
  });

  return data;
}

export async function updateService(
  id: string,
  name: string,
  defaultWorkTypeId: string | null,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ name, default_work_type_id: defaultWorkTypeId })
    .eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "service.update",
    entity: "services",
    entity_id: id,
    details: { name, default_work_type_id: defaultWorkTypeId },
  });
}
