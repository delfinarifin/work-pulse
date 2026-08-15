import { createClient } from "@/lib/supabase/server";

export async function writeAuditLog(entry: {
  action: string;
  entity: string;
  entity_id: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_logs").insert(entry);
  if (error) throw error;
}
