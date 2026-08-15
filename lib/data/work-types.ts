import { createClient } from "@/lib/supabase/server";
import type { WorkType } from "@/lib/types";

export async function listWorkTypes(): Promise<WorkType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_types")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
