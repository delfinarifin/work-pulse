import { createClient } from "@/lib/supabase/server";
import type { ActivityWithJoins } from "@/lib/types";

const ACTIVITY_SELECT =
  "*, consultant:consultants(id, name), work_type:work_types(id, label, category)";

export type NewActivity = {
  consultant_id: string;
  file_name: string;
  application: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  work_type_id: string | null;
  work_type_value: string;
  work_type_source: string;
  work_type_confidence: number;
  project_label?: string | null;
};

export async function insertActivity(
  activity: NewActivity,
): Promise<ActivityWithJoins> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .insert(activity)
    .select(ACTIVITY_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as ActivityWithJoins;
}

export async function listActivities(
  limit = 50,
): Promise<ActivityWithJoins[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as ActivityWithJoins[];
}

export async function listActivitiesForConsultantOnDate(
  consultantId: string,
  date: string,
): Promise<ActivityWithJoins[]> {
  const supabase = await createClient();
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("consultant_id", consultantId)
    .gte("started_at", dayStart)
    .lte("started_at", dayEnd);

  if (error) throw error;
  return (data ?? []) as unknown as ActivityWithJoins[];
}

export async function listActivityDatesForConsultants(
  consultantIds: string[],
): Promise<{ consultant_id: string; date: string }[]> {
  if (consultantIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("consultant_id, started_at")
    .in("consultant_id", consultantIds);

  if (error) throw error;
  const pairs = new Map<string, { consultant_id: string; date: string }>();
  for (const row of data ?? []) {
    const date = (row.started_at as string).slice(0, 10);
    const key = `${row.consultant_id}:${date}`;
    pairs.set(key, { consultant_id: row.consultant_id as string, date });
  }
  return Array.from(pairs.values());
}
