import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

export async function listClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
