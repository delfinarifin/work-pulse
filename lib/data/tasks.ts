import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";
import { writeAuditLog } from "@/lib/data/audit-logs";

export async function listTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Only succeeds for a caller whose role is admin — enforced by RLS
// (tasks_admin_write, 0007), not by this function.
export async function createTask(name: string): Promise<Task> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").insert({ name }).select("*").single();
  if (error) throw error;

  await writeAuditLog({ action: "task.create", entity: "tasks", entity_id: data.id, details: { name } });

  return data;
}

export async function updateTask(id: string, name: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ name }).eq("id", id);
  if (error) throw error;

  await writeAuditLog({ action: "task.update", entity: "tasks", entity_id: id, details: { name } });
}
