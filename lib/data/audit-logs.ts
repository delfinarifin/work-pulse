import { createClient } from "@/lib/supabase/server";

export async function writeAuditLog(entry: {
  action: string;
  entity: string;
  entity_id: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("audit_logs")
    .insert({ ...entry, user_id: user?.id ?? null });
  if (error) throw error;
}
