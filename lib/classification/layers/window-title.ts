import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClassifySessionInput, LayerResult } from "../types";
import { normalizeText } from "../match";

// Layer 4 of the client cascade — no configured mapping exists yet, so fall
// back to matching the client's own name/company name against whatever text
// we have (window title, else filename/path). Lower confidence than an
// explicit mapping since it's a loose substring match on freeform text.
export async function matchWindowTitle(
  supabase: SupabaseClient,
  input: ClassifySessionInput,
): Promise<LayerResult | null> {
  const haystack = input.windowTitle ?? input.fileName ?? input.filePath;
  if (!haystack) return null;
  const normalizedHaystack = normalizeText(haystack);

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, company_name")
    .eq("active", true);
  if (error) throw error;

  for (const client of data ?? []) {
    const candidates = [client.name, client.company_name].filter(
      (c): c is string => !!c && c.trim().length > 2,
    );
    for (const candidate of candidates) {
      if (normalizedHaystack.includes(normalizeText(candidate))) {
        return {
          layer: "window_title",
          clientId: client.id,
          confidence: 0.6,
          matchedRuleTable: "clients",
          matchedRuleId: client.id,
        };
      }
    }
  }
  return null;
}
