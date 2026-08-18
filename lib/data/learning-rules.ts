import { createClient } from "@/lib/supabase/server";
import type { BillableStatus, MatchScope } from "@/lib/types";
import { normalizeText } from "@/lib/classification/match";

export type CorrectionInput = {
  consultantId: string;
  filePath: string | null;
  fileName: string | null;
  clientId: string | null;
  serviceId: string | null;
  taskId: string | null;
  billableStatus: BillableStatus;
  sourceSessionId: string;
};

// Derives a learning-rule pattern from a correction, preferring the most
// robust signal available: containing folder path (future files in the same
// client folder auto-match) → a filename keyword → nothing (no rule created).
function derivePattern(
  filePath: string | null,
  fileName: string | null,
): { pattern: string; patternType: "folder_path" | "filename_keyword"; matchScope: MatchScope } | null {
  if (filePath) {
    const folder = filePath.replace(/[/\\][^/\\]*$/, "");
    if (folder && folder !== filePath) {
      return { pattern: folder, patternType: "folder_path", matchScope: "path" };
    }
  }
  if (fileName) {
    const base = fileName.replace(/\.[^.]+$/, "");
    const normalized = normalizeText(base);
    if (normalized) {
      return { pattern: normalized, patternType: "filename_keyword", matchScope: "filename" };
    }
  }
  return null;
}

// Called on every "Change" correction — upserts (rather than duplicates) on
// repeat corrections to the same pattern, so the rule refreshes instead of
// piling up. Returns null if no usable pattern could be derived (nothing to
// learn from).
export async function recordCorrection(input: CorrectionInput): Promise<string | null> {
  const derived = derivePattern(input.filePath, input.fileName);
  if (!derived) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("activity_learning_rules")
    .select("id, times_applied")
    .eq("consultant_id", input.consultantId)
    .eq("pattern_type", derived.patternType)
    .eq("pattern", derived.pattern)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("activity_learning_rules")
      .update({
        client_id: input.clientId,
        service_id: input.serviceId,
        task_id: input.taskId,
        billable_status: input.billableStatus,
        source_session_id: input.sourceSessionId,
        active: true,
        times_applied: existing.times_applied + 1,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("activity_learning_rules")
    .insert({
      consultant_id: input.consultantId,
      scope: "personal",
      pattern_type: derived.patternType,
      pattern: derived.pattern,
      match_scope: derived.matchScope,
      client_id: input.clientId,
      service_id: input.serviceId,
      task_id: input.taskId,
      billable_status: input.billableStatus,
      source_session_id: input.sourceSessionId,
      user_id: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

export async function listLearningRules(consultantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_learning_rules")
    .select(
      "*, client:clients(id, name), service:services(id, name), task:tasks(id, name)",
    )
    .eq("consultant_id", consultantId)
    .order("times_applied", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
