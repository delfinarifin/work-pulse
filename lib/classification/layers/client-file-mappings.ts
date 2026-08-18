import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClassificationLayer, ClassifySessionInput, LayerResult } from "../types";
import { matchesPattern, textForScope } from "../match";

const LAYER_BY_PATTERN_TYPE: Record<string, ClassificationLayer> = {
  exact_file: "exact_file",
  folder_path: "folder_pattern",
  filename_regex: "filename_client_code",
  client_code: "filename_client_code",
};

// Layers 1-3 of the client cascade: exact file match, folder/path pattern,
// filename/client-code. Queried together (ordered by priority) since they
// share one table — the pattern_type on the winning row determines which
// named layer gets reported in the classification trail.
export async function matchClientFileMappings(
  supabase: SupabaseClient,
  input: ClassifySessionInput,
  patternTypes: string[],
): Promise<LayerResult | null> {
  const { data, error } = await supabase
    .from("client_file_mappings")
    .select("*")
    .in("pattern_type", patternTypes)
    .eq("active", true)
    .order("priority", { ascending: true });
  if (error) throw error;

  for (const mapping of data ?? []) {
    const haystack = textForScope(input, mapping.match_scope);
    if (matchesPattern(haystack, mapping.pattern)) {
      return {
        layer: LAYER_BY_PATTERN_TYPE[mapping.pattern_type] ?? "filename_client_code",
        clientId: mapping.client_id,
        confidence: 0.95,
        matchedRuleTable: "client_file_mappings",
        matchedRuleId: mapping.id,
      };
    }
  }
  return null;
}
