import { createClient } from "@/lib/supabase/server";
import type { WorkType } from "@/lib/types";

// Insertion order in the migration is the classification priority order
// (Documentation > Design > Development > Presentation > Analysis > Unclassified).
export async function listWorkTypes(): Promise<WorkType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_types")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
