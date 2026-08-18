export type Consultant = {
  id: string;
  name: string;
  email: string;
  job_role: string;
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
};

export type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};
