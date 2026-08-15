import { createClient } from "@/lib/supabase/server";

export async function writeAuditLog(entry: {
  actor: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_logs").insert(entry);
  if (error) throw error;
}
