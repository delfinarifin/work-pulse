import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClassifySessionInput, LayerResult } from "../types";
import { matchesPattern, textForScope } from "../match";

// The keyword-mapping layer for BOTH service and task cascades (each run
// independently by the orchestrator). Configurable successor to the
// hardcoded arrays that used to live in lib/logic/classify.ts.
export async function matchServiceMappings(
  supabase: SupabaseClient,
  input: ClassifySessionInput,
): Promise<LayerResult | null> {
  const { data, error } = await supabase
    .from("service_mappings")
    .select("*")
    .eq("active", true)
    .order("priority", { ascending: true });
  if (error) throw error;

  for (const mapping of data ?? []) {
    const haystack = textForScope(input, mapping.match_scope);
    if (matchesPattern(haystack, mapping.pattern)) {
      return {
        layer: "keyword_mapping",
        serviceId: mapping.service_id,
        confidence: mapping.confidence,
        matchedRuleTable: "service_mappings",
        matchedRuleId: mapping.id,
      };
    }
  }
  return null;
}

export async function matchTaskMappings(
  supabase: SupabaseClient,
  input: ClassifySessionInput,
): Promise<LayerResult | null> {
  const { data, error } = await supabase
    .from("task_mappings")
    .select("*")
    .eq("active", true)
    .order("priority", { ascending: true });
  if (error) throw error;

  for (const mapping of data ?? []) {
    const haystack = textForScope(input, mapping.match_scope);
    if (matchesPattern(haystack, mapping.pattern)) {
      return {
        layer: "keyword_mapping",
        taskId: mapping.task_id,
        confidence: mapping.confidence,
        matchedRuleTable: "task_mappings",
        matchedRuleId: mapping.id,
      };
    }
  }
  return null;
}
