import type { ClassifySessionInput, LayerResult } from "../types";

// Optional layer 5 of the client cascade. Scaffolded interface only — no LLM
// call is wired up. Requires an LLM API key (Anthropic/OpenAI) configured in
// Vercel env, which does not exist for this project yet (Phase 4, deferred).
// Never sends file contents — metadata only (filename/path/window title),
// matching the project's privacy requirements.
const AI_CLASSIFICATION_ENABLED = false;

export async function matchAiMetadata(
  _input: ClassifySessionInput,
): Promise<LayerResult | null> {
  if (!AI_CLASSIFICATION_ENABLED) return null;
  throw new Error("AI classification is not configured (Phase 4, deferred).");
}
