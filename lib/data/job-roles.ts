import { createClient } from "@/lib/supabase/server";
import type { JobRole } from "@/lib/types";

export async function listJobRoles(): Promise<JobRole[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_roles")
    .select("*")
    .order("title", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
