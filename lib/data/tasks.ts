import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";

export async function listTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
