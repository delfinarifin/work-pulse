import { createClient } from "@/lib/supabase/server";
import type { Consultant } from "@/lib/types";

export async function listConsultants(): Promise<Consultant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consultants")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
