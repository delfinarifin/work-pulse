import type { SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { ClassifySessionInput, LayerResult } from "../types";
import { createServiceClient } from "@/lib/supabase/service";

// Layer 5 of the cascade — the semantic fallback for when nothing in the
// deterministic layers (learned rules, file/folder mappings, window-title
// keywords) matches. Never sends file content, only metadata (filename/
// path/window title/application name) — matches docs/PRD.md's "never
// content" guarantee. Requires ANTHROPIC_API_KEY; silently disabled (falls
// through to "unclassified", same as every other layer returning null)
// when it isn't configured, so the cascade works with or without it.
const AI_CLASSIFICATION_ENABLED = !!process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-opus-5";

const ResultSchema = z.object({
  client_id: z.string().nullable(),
  service_id: z.string().nullable(),
  service_new_name: z.string().nullable(),
  task_id: z.string().nullable(),
  task_new_name: z.string().nullable(),
  billable_status: z
    .enum(["billable", "non_billable", "internal", "training", "administration"])
    .nullable(),
  confidence: z.number().min(0).max(1),
});

export async function matchAiMetadata(
  supabase: SupabaseClient,
  input: ClassifySessionInput,
): Promise<LayerResult | null> {
  if (!AI_CLASSIFICATION_ENABLED) return null;
  if (!input.fileName && !input.windowTitle && !input.applicationName) return null;

  const [clientsRes, servicesRes, tasksRes] = await Promise.all([
    supabase.from("clients").select("id, name").limit(300),
    supabase.from("services").select("id, name"),
    supabase.from("tasks").select("id, name"),
  ]);
  const clients = clientsRes.data ?? [];
  const services = servicesRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const clientIds = new Set(clients.map((c) => c.id));
  const serviceIds = new Set(services.map((s) => s.id));
  const taskIds = new Set(tasks.map((t) => t.id));

  let parsed: z.infer<typeof ResultSchema> | null;
  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 1024,
      system:
        "You classify one work session for a tax/accounting consulting firm from file/window " +
        "metadata only (never file content, which you do not have). Given the active " +
        "application name, window title, and file name/path, pick the best-matching client " +
        "from the provided list (or null if none fits — do not guess a client that isn't " +
        "listed; plenty of real work has no client at all, e.g. internal admin, breaks, " +
        "personal browsing, HR/IT tasks). For service and task, pick the best-matching " +
        "existing one from the provided lists; if the work genuinely doesn't fit any existing " +
        "service or task, propose a short, specific new name via " +
        "service_new_name/task_new_name instead of forcing a poor-fit match (leave the " +
        "matching _id null in that case) — this includes work that has nothing to do with tax " +
        "or accounting. Always classify into SOME service and task rather than leaving both " +
        "null — even non-billable, non-client, or unrelated activity is real work and should " +
        "be counted, not silently dropped; use a generic category (e.g. 'General " +
        "Administration', 'Personal/Break', 'Internal Operations') if nothing more specific " +
        "applies. Only leave service/task null if there is truly no signal at all (e.g. " +
        "window_title and file_name are both empty). Set billable_status to " +
        "billable only for real client-facing work; use non_billable/internal/training/" +
        "administration for everything else. confidence is 0-1, how sure you are overall.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            application_name: input.applicationName,
            window_title: input.windowTitle,
            file_name: input.fileName,
            file_path: input.filePath,
            clients,
            services,
            tasks,
          }),
        },
      ],
      output_config: { format: zodOutputFormat(ResultSchema) },
    });
    parsed = response.parsed_output;
  } catch (err) {
    console.error("ai classification failed", err);
    return null;
  }
  if (!parsed) return null;

  // Never trust an id the model returned that wasn't actually in the list
  // we gave it — a hallucinated id would otherwise silently attach the
  // session to the wrong client/service/task.
  const clientId = parsed.client_id && clientIds.has(parsed.client_id) ? parsed.client_id : null;
  let serviceId = parsed.service_id && serviceIds.has(parsed.service_id) ? parsed.service_id : null;
  let taskId = parsed.task_id && taskIds.has(parsed.task_id) ? parsed.task_id : null;

  // The taxonomy is allowed to grow from AI guesses (explicit product
  // decision) — a brand-new service/task the model proposes gets created
  // outright, not just suggested for review. Uses the service-role client
  // regardless of which client classifySession was called with, since
  // this is a system-level taxonomy write, not a user action — a
  // consultant (non-admin) triggering classification via Log Activity or
  // the agent must be able to reach this same path.
  if (!serviceId && parsed.service_new_name?.trim()) {
    const service = createServiceClient();
    const { data } = await service
      .from("services")
      .insert({ name: parsed.service_new_name.trim() })
      .select("id")
      .single();
    serviceId = data?.id ?? null;
  }
  if (!taskId && parsed.task_new_name?.trim()) {
    const service = createServiceClient();
    const { data } = await service
      .from("tasks")
      .insert({ name: parsed.task_new_name.trim() })
      .select("id")
      .single();
    taskId = data?.id ?? null;
  }

  if (!clientId && !serviceId && !taskId) return null;

  return {
    layer: "ai_metadata",
    clientId,
    serviceId,
    taskId,
    billableStatus: parsed.billable_status,
    confidence: parsed.confidence,
  };
}
