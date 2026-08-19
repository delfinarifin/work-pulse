export type ConsultantRole = "consultant" | "manager" | "admin";

export type Consultant = {
  id: string;
  name: string;
  email: string;
  job_role: string;
  role: ConsultantRole;
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  company_name: string | null;
  created_at: string;
};

export type WorkType = {
  id: string;
  name: string;
  category: "tax" | "accounting";
  created_at: string;
};

export type BillableStatus =
  | "billable"
  | "non_billable"
  | "internal"
  | "training"
  | "administration";

export type Service = {
  id: string;
  name: string;
  default_work_type_id: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  name: string;
  created_at: string;
};

export type MatchScope = "filename" | "path" | "window_title";

export type ServiceMapping = {
  id: string;
  service_id: string;
  pattern: string;
  match_scope: MatchScope;
  priority: number;
  confidence: number;
  active: boolean;
  created_at: string;
};

export type TaskMapping = {
  id: string;
  task_id: string;
  pattern: string;
  match_scope: MatchScope;
  priority: number;
  confidence: number;
  active: boolean;
  created_at: string;
};

export type ClientFileMapping = {
  id: string;
  client_id: string;
  pattern_type: "exact_file" | "folder_path" | "filename_regex" | "client_code";
  pattern: string;
  match_scope: MatchScope;
  priority: number;
  active: boolean;
  created_at: string;
};

export type BillableTaskRule = {
  id: string;
  task_id: string;
  client_id: string | null;
  billable_status: BillableStatus;
  priority: number;
  active: boolean;
  created_at: string;
};

export type ClassificationSettings = {
  id: string;
  consultant_id: string;
  idle_threshold_minutes: number;
  confidence_auto_accept_threshold: number;
  confidence_confirm_threshold: number;
  created_at: string;
};

export type ActivityLearningRule = {
  id: string;
  consultant_id: string;
  scope: "personal" | "firm";
  pattern_type: "folder_path" | "filename_keyword" | "app_window_title";
  pattern: string;
  match_scope: MatchScope;
  client_id: string | null;
  service_id: string | null;
  task_id: string | null;
  billable_status: BillableStatus | null;
  confidence: number;
  times_applied: number;
  source_session_id: string | null;
  active: boolean;
  created_at: string;
};

export type Device = {
  id: string;
  consultant_id: string;
  device_name: string;
  platform: string | null;
  agent_version: string | null;
  status: "pending" | "active" | "revoked";
  last_seen_at: string | null;
  created_at: string;
};

export type SessionStatus = "active" | "idle" | "paused" | "offline" | "closed";
export type ReviewStatus = "unreviewed" | "confirmed" | "changed" | "ignored";
export type ClassificationSource = "agent" | "manual";

export type ActivitySession = {
  id: string;
  consultant_id: string;
  device_id: string | null;
  client_id: string | null;
  service_id: string | null;
  task_id: string | null;
  work_type_id: string | null;
  application_name: string | null;
  window_title: string | null;
  file_name: string | null;
  file_path: string | null;
  started_at: string;
  ended_at: string | null;
  active_duration_minutes: number;
  idle_duration_minutes: number;
  status: SessionStatus;
  billable_status: BillableStatus;
  classification_method: string | null;
  classification_confidence: number | null;
  review_status: ReviewStatus;
  source: ClassificationSource;
  merged_into_session_id: string | null;
  notes: string | null;
  created_at: string;
};

export type ActivitySessionWithJoins = ActivitySession & {
  consultant: { id: string; name: string; job_role: string } | null;
  client: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
  task: { id: string; name: string } | null;
};

export type ActivityEvent = {
  id: string;
  consultant_id: string;
  client_id: string | null;
  file_name: string;
  file_path: string | null;
  event_type: "open" | "edit" | "close";
  work_type_id: string | null;
  work_type_source: string | null;
  work_type_confidence: number | null;
  review_status: string;
  started_at: string;
  ended_at: string | null;
  session_id: string | null;
  device_id: string | null;
  is_idle: boolean;
  user_id: string | null;
  created_at: string;
};

export type ActivityEventWithJoins = ActivityEvent & {
  consultant: { id: string; name: string } | null;
  client: { id: string; name: string } | null;
  work_type: { id: string; name: string; category: string } | null;
};

export type TimesheetEntry = {
  id: string;
  consultant_id: string;
  client_id: string | null;
  work_type_id: string | null;
  service_id: string | null;
  task_id: string | null;
  billable_status: BillableStatus;
  session_id: string | null;
  date: string;
  duration_minutes: number;
  source: "auto" | "manual";
  notes: string | null;
  created_at: string;
};

export type TimesheetEntryWithJoins = TimesheetEntry & {
  consultant: { id: string; name: string; job_role: string } | null;
  client: { id: string; name: string } | null;
  work_type: { id: string; name: string; category: string } | null;
  service: { id: string; name: string } | null;
  task: { id: string; name: string } | null;
};

export type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};
