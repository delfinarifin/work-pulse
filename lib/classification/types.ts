import type { BillableStatus, MatchScope } from "@/lib/types";

export type ClassificationLayer =
  | "learned_rule"
  | "exact_file"
  | "folder_pattern"
  | "filename_client_code"
  | "window_title"
  | "ai_metadata"
  | "keyword_mapping"
  | "fallback_default";

export type LayerResult = {
  layer: ClassificationLayer;
  clientId?: string | null;
  serviceId?: string | null;
  taskId?: string | null;
  billableStatus?: BillableStatus | null;
  confidence: number;
  matchedRuleTable?: string;
  matchedRuleId?: string;
};

export type ClassifySessionInput = {
  consultantId: string;
  fileName: string | null;
  filePath: string | null;
  applicationName: string | null;
  windowTitle: string | null;
};

export type ClassifySessionResult = {
  clientId: string | null;
  clientConfidence: number;
  clientMethod: ClassificationLayer | null;
  serviceId: string | null;
  serviceConfidence: number;
  serviceMethod: ClassificationLayer | null;
  taskId: string | null;
  taskConfidence: number;
  taskMethod: ClassificationLayer | null;
  workTypeId: string | null;
  billableStatus: BillableStatus;
  overallConfidence: number;
  needsConfirmation: boolean;
  trail: LayerResult[];
};

export type { MatchScope };
