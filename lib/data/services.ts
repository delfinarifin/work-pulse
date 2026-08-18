import { createClient } from "@/lib/supabase/server";
import type { Service } from "@/lib/types";

export async function listServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
