import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClassifySessionInput, LayerResult } from "../types";
import { matchesPattern, textForScope } from "../match";

// Checked first, ahead of every firm-wide mapping table — a consultant's own
// correction takes effect immediately for the next matching file/folder.
export async function matchLearnedRules(
  supabase: SupabaseClient,
  consultantId: string,
  input: ClassifySessionInput,
): Promise<LayerResult | null> {
  const { data, error } = await supabase
    .from("activity_learning_rules")
    .select("*")
    .eq("consultant_id", consultantId)
    .eq("active", true);
  if (error) throw error;

  for (const rule of data ?? []) {
    const haystack = textForScope(input, rule.match_scope);
    if (matchesPattern(haystack, rule.pattern)) {
      return {
        layer: "learned_rule",
        clientId: rule.client_id,
        serviceId: rule.service_id,
        taskId: rule.task_id,
        billableStatus: rule.billable_status,
        confidence: rule.confidence,
        matchedRuleTable: "activity_learning_rules",
        matchedRuleId: rule.id,
      };
    }
  }
  return null;
}
