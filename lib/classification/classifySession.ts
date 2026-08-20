import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillableStatus } from "@/lib/types";
import type { ClassifySessionInput, ClassifySessionResult, LayerResult } from "./types";
import { matchLearnedRules } from "./layers/learned-rules";
import { matchClientFileMappings } from "./layers/client-file-mappings";
import { matchWindowTitle } from "./layers/window-title";
import { matchAiMetadata } from "./layers/ai-metadata";
import { matchServiceMappings, matchTaskMappings } from "./layers/service-task";

const NO_MATCH_CONFIDENCE = 0.3;
const DEFAULT_SETTINGS = {
  idle_threshold_minutes: 5,
  confidence_auto_accept_threshold: 0.75,
  confidence_confirm_threshold: 0.4,
};

export type { ClassifySessionInput, ClassifySessionResult };

export async function classifySession(
  supabase: SupabaseClient,
  input: ClassifySessionInput,
): Promise<ClassifySessionResult> {
  const trail: LayerResult[] = [];

  const { data: settingsRow } = await supabase
    .from("classification_settings")
    .select("*")
    .eq("consultant_id", input.consultantId)
    .maybeSingle();
  const settings = settingsRow ?? DEFAULT_SETTINGS;

  const learned = await matchLearnedRules(supabase, input.consultantId, input);
  if (learned) trail.push(learned);

  let clientResult: LayerResult | null =
    learned?.clientId !== undefined && learned?.clientId !== null ? learned : null;
  if (!clientResult) {
    clientResult =
      (await matchClientFileMappings(supabase, input, ["exact_file"])) ??
      (await matchClientFileMappings(supabase, input, ["folder_path"])) ??
      (await matchClientFileMappings(supabase, input, ["filename_regex", "client_code"])) ??
      (await matchWindowTitle(supabase, input));
    if (clientResult) trail.push(clientResult);
  }

  let serviceResult: LayerResult | null =
    learned?.serviceId !== undefined && learned?.serviceId !== null ? learned : null;
  if (!serviceResult) {
    serviceResult = await matchServiceMappings(supabase, input);
    if (serviceResult) trail.push(serviceResult);
  }

  let taskResult: LayerResult | null =
    learned?.taskId !== undefined && learned?.taskId !== null ? learned : null;
  if (!taskResult) {
    taskResult = await matchTaskMappings(supabase, input);
    if (taskResult) trail.push(taskResult);
  }

  // AI fallback (layer 5) — one combined call rather than one per
  // dimension, only when at least one of client/service/task is still
  // unresolved after every deterministic layer had a chance. Fills in
  // only the pieces that are still missing; a deterministic match for
  // one dimension is never overridden by the AI guess for that same
  // dimension.
  let aiResult: LayerResult | null = null;
  if (!clientResult || !serviceResult || !taskResult) {
    aiResult = await matchAiMetadata(supabase, input);
    if (aiResult) {
      trail.push(aiResult);
      if (!clientResult && aiResult.clientId) clientResult = aiResult;
      if (!serviceResult && aiResult.serviceId) serviceResult = aiResult;
      if (!taskResult && aiResult.taskId) taskResult = aiResult;
    }
  }

  // Deterministic catch-all — works even with no AI key configured. Every
  // session gets *something* rather than staying permanently
  // unclassified: falls back to the seeded "Administration" task /
  // "Other" service, not left blank. Only kicks in when NEITHER service
  // nor task resolved from any layer above (a partial match, e.g. task
  // but no service, is left alone — that's a real gap the consultant
  // should fill via Change, not paper over).
  let fallbackBillableStatus: BillableStatus | null = null;
  if (!serviceResult && !taskResult) {
    const fallback = await getFallbackServiceTask(supabase);
    if (fallback) {
      fallbackBillableStatus = "administration";
      const fallbackLayer: LayerResult = {
        layer: "fallback_default",
        serviceId: fallback.serviceId,
        taskId: fallback.taskId,
        billableStatus: fallbackBillableStatus,
        confidence: NO_MATCH_CONFIDENCE,
      };
      serviceResult = fallback.serviceId ? fallbackLayer : serviceResult;
      taskResult = fallback.taskId ? fallbackLayer : taskResult;
      if (fallback.serviceId || fallback.taskId) trail.push(fallbackLayer);
    }
  }

  const clientId = clientResult?.clientId ?? null;
  const serviceId = serviceResult?.serviceId ?? null;
  const taskId = taskResult?.taskId ?? null;
  const clientConfidence = clientResult?.confidence ?? NO_MATCH_CONFIDENCE;
  const serviceConfidence = serviceResult?.confidence ?? NO_MATCH_CONFIDENCE;
  const taskConfidence = taskResult?.confidence ?? NO_MATCH_CONFIDENCE;

  const workTypeId = await bridgeWorkTypeId(supabase, serviceId);
  const billableStatus = await resolveBillableStatus(
    supabase,
    learned,
    taskId,
    clientId,
    aiResult,
    fallbackBillableStatus,
  );

  const overallConfidence = Math.min(clientConfidence, serviceConfidence, taskConfidence);
  const needsConfirmation = overallConfidence < settings.confidence_auto_accept_threshold;

  return {
    clientId,
    clientConfidence,
    clientMethod: clientResult?.layer ?? null,
    serviceId,
    serviceConfidence,
    serviceMethod: serviceResult?.layer ?? null,
    taskId,
    taskConfidence,
    taskMethod: taskResult?.layer ?? null,
    workTypeId,
    billableStatus,
    overallConfidence,
    needsConfirmation,
    trail,
  };
}

export async function bridgeWorkTypeId(
  supabase: SupabaseClient,
  serviceId: string | null,
): Promise<string | null> {
  if (!serviceId) return null;
  const { data } = await supabase
    .from("services")
    .select("default_work_type_id")
    .eq("id", serviceId)
    .maybeSingle();
  return data?.default_work_type_id ?? null;
}

async function resolveBillableStatus(
  supabase: SupabaseClient,
  learned: LayerResult | null,
  taskId: string | null,
  clientId: string | null,
  aiResult: LayerResult | null,
  fallbackBillableStatus: BillableStatus | null,
): Promise<BillableStatus> {
  if (learned?.billableStatus) return learned.billableStatus;

  if (taskId) {
    const { data } = await supabase
      .from("billable_task_rules")
      .select("*")
      .eq("task_id", taskId)
      .eq("active", true)
      .order("priority", { ascending: true });

    const clientSpecific = (data ?? []).find((r) => r.client_id === clientId);
    if (clientSpecific) return clientSpecific.billable_status;
    const generic = (data ?? []).find((r) => r.client_id === null);
    if (generic) return generic.billable_status;
  }

  // No configured rule for this task (or no task at all) — the AI's own
  // estimate is a better default than blindly assuming "billable" for
  // clearly non-client work (breaks, internal admin) it just classified.
  if (aiResult?.billableStatus) return aiResult.billableStatus;
  if (fallbackBillableStatus) return fallbackBillableStatus;
  return "billable";
}

// The seeded "Administration" task / "Other" service — the deterministic
// catch-all so a session never stays permanently unclassified even
// without AI configured. Looked up by name rather than a hardcoded id
// since these are ordinary seeded rows, not schema constants.
async function getFallbackServiceTask(
  supabase: SupabaseClient,
): Promise<{ serviceId: string | null; taskId: string | null } | null> {
  const [taskRes, serviceRes] = await Promise.all([
    supabase.from("tasks").select("id").ilike("name", "Administration").maybeSingle(),
    supabase.from("services").select("id").ilike("name", "Other").maybeSingle(),
  ]);
  const taskId = taskRes.data?.id ?? null;
  const serviceId = serviceRes.data?.id ?? null;
  if (!taskId && !serviceId) return null;
  return { serviceId, taskId };
}
