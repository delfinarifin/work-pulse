import { createClient } from "@/lib/supabase/server";
import type { Consultant, ConsultantRole } from "@/lib/types";

export async function listConsultants(): Promise<Consultant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consultants")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// The signed-in user's own consultant record IS their identity in the app —
// created on first access from the name/job_role captured at signup.
export async function getCurrentConsultant(): Promise<Consultant | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing, error: lookupError } = await supabase
    .from("consultants")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from("consultants")
    .insert({
      user_id: user.id,
      name: (user.user_metadata?.name as string | undefined) ?? user.email?.split("@")[0] ?? "New Consultant",
      email: user.email!,
      job_role: (user.user_metadata?.job_role as string | undefined) ?? "Consultant",
    })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return created;
}

// Only succeeds for a caller whose own role is 'admin' — enforced by RLS
// (consultants_admin_write) and backstopped by the
// prevent_role_self_escalation trigger, not by this function.
export async function updateConsultantRole(id: string, role: ConsultantRole): Promise<Consultant> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consultants")
    .update({ role })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
