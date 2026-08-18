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
      (await matchWindowTitle(supabase, input)) ??
      (await matchAiMetadata(input));
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

async function bridgeWorkTypeId(
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
): Promise<BillableStatus> {
  if (learned?.billableStatus) return learned.billableStatus;
  if (!taskId) return "billable";

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
  return "billable";
}
