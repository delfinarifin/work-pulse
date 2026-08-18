import { createClient } from "@/lib/supabase/server";
import type { ClassificationSettings } from "@/lib/types";

const DEFAULTS = {
  idle_threshold_minutes: 5,
  confidence_auto_accept_threshold: 0.75,
  confidence_confirm_threshold: 0.4,
};

// Lazily created on first access, same pattern as getCurrentConsultant().
export async function getOrCreateClassificationSettings(
  consultantId: string,
): Promise<ClassificationSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing, error: lookupError } = await supabase
    .from("classification_settings")
    .select("*")
    .eq("consultant_id", consultantId)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from("classification_settings")
    .insert({ consultant_id: consultantId, user_id: user?.id ?? null, ...DEFAULTS })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return created;
}

export async function updateClassificationSettings(
  id: string,
  changes: Partial<{
    idle_threshold_minutes: number;
    confidence_auto_accept_threshold: number;
    confidence_confirm_threshold: number;
  }>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("classification_settings")
    .update(changes)
    .eq("id", id);
  if (error) throw error;
}
