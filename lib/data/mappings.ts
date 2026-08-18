import { createClient } from "@/lib/supabase/server";
import type { BillableTaskRule, ClientFileMapping, ServiceMapping, TaskMapping } from "@/lib/types";

// Firm-wide reference/config data — read-only for now (no admin role yet to
// gate write access; seeded/edited via migrations, same as work_types).

export async function listClientFileMappings(): Promise<ClientFileMapping[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_file_mappings")
    .select("*")
    .order("priority", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listServiceMappings(): Promise<ServiceMapping[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_mappings")
    .select("*")
    .order("priority", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listTaskMappings(): Promise<TaskMapping[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_mappings")
    .select("*")
    .order("priority", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listBillableTaskRules(): Promise<BillableTaskRule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("billable_task_rules")
    .select("*")
    .order("priority", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
