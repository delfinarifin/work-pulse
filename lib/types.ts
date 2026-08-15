export type Consultant = {
  id: string;
  name: string;
  email: string | null;
  job_role_id: string | null;
  team_id: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  created_at: string;
};

export type JobRole = {
  id: string;
  title: string;
  created_at: string;
};

export type WorkType = {
  id: string;
  label: string;
  category: string;
  keywords: string[];
  created_at: string;
};

export type Activity = {
  id: string;
  consultant_id: string;
  file_name: string;
  application: string;
  event_type: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  work_type_id: string | null;
  work_type_value: string | null;
  work_type_source: string | null;
  work_type_confidence: number | null;
  work_type_review_status: string;
  project_label: string | null;
  created_at: string;
};

export type ActivityWithJoins = Activity & {
  consultant: { id: string; name: string } | null;
  work_type: { id: string; label: string; category: string } | null;
};

export type TimesheetEntry = {
  id: string;
  consultant_id: string;
  date: string;
  work_type_id: string | null;
  job_role_id: string | null;
  total_minutes: number;
  source: "auto" | "manual";
  status: "draft" | "approved" | "edited";
  created_at: string;
};

export type TimesheetEntryWithJoins = TimesheetEntry & {
  consultant: { id: string; name: string } | null;
  work_type: { id: string; label: string; category: string } | null;
  job_role: { id: string; title: string } | null;
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
