import { createClient } from "@/lib/supabase/server";
import type { ActivitySessionWithJoins, BillableStatus, ReviewStatus } from "@/lib/types";

const SESSION_SELECT =
  "*, consultant:consultants(id, name, job_role), client:clients(id, name), service:services(id, name), task:tasks(id, name)";

export type NewActivitySession = {
  consultant_id: string;
  client_id: string | null;
  service_id: string | null;
  task_id: string | null;
  work_type_id: string | null;
  billable_status: BillableStatus;
  application_name?: string | null;
  window_title?: string | null;
  file_name: string | null;
  file_path?: string | null;
  started_at: string;
  ended_at: string;
  active_duration_minutes: number;
  classification_method: string | null;
  classification_confidence: number | null;
  review_status: ReviewStatus;
  source: "agent" | "manual";
};

export async function insertActivitySession(
  session: NewActivitySession,
): Promise<ActivitySessionWithJoins> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("activity_sessions")
    .insert({ ...session, user_id: user?.id ?? null })
    .select(SESSION_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as ActivitySessionWithJoins;
}

export async function listActivitySessions(
  limit = 50,
): Promise<ActivitySessionWithJoins[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_sessions")
    .select(SESSION_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as ActivitySessionWithJoins[];
}

export async function listActivitySessionsForConsultantOnDate(
  consultantId: string,
  date: string,
): Promise<ActivitySessionWithJoins[]> {
  const supabase = await createClient();
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;
  const { data, error } = await supabase
    .from("activity_sessions")
    .select(SESSION_SELECT)
    .eq("consultant_id", consultantId)
    .gte("started_at", dayStart)
    .lte("started_at", dayEnd);

  if (error) throw error;
  return (data ?? []) as unknown as ActivitySessionWithJoins[];
}

export async function getActivitySession(
  id: string,
): Promise<ActivitySessionWithJoins | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_sessions")
    .select(SESSION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as ActivitySessionWithJoins | null;
}

export async function updateActivitySession(
  id: string,
  changes: Partial<{
    client_id: string | null;
    service_id: string | null;
    task_id: string | null;
    work_type_id: string | null;
    billable_status: BillableStatus;
    review_status: ReviewStatus;
    active_duration_minutes: number;
    notes: string | null;
    merged_into_session_id: string | null;
  }>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("activity_sessions").update(changes).eq("id", id);
  if (error) throw error;
}

export async function deleteActivitySession(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("activity_sessions").delete().eq("id", id);
  if (error) throw error;
}
