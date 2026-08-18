import { createClient } from "@/lib/supabase/server";
import type { ActivityEventWithJoins } from "@/lib/types";

const EVENT_SELECT =
  "*, consultant:consultants(id, name), client:clients(id, name), work_type:work_types(id, name, category)";

export type NewActivityEvent = {
  consultant_id: string;
  client_id: string | null;
  file_name: string;
  file_path?: string | null;
  event_type: "open" | "edit" | "close";
  started_at: string;
  ended_at: string;
  work_type_id: string | null;
  work_type_source: string;
  work_type_confidence: number;
};

export async function insertActivityEvent(
  event: NewActivityEvent,
): Promise<ActivityEventWithJoins> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("activity_events")
    .insert({ ...event, user_id: user?.id ?? null })
    .select(EVENT_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as ActivityEventWithJoins;
}

export async function listActivityEvents(
  limit = 50,
): Promise<ActivityEventWithJoins[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select(EVENT_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as ActivityEventWithJoins[];
}

export async function listActivityEventsForConsultantOnDate(
  consultantId: string,
  date: string,
): Promise<ActivityEventWithJoins[]> {
  const supabase = await createClient();
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;
  const { data, error } = await supabase
    .from("activity_events")
    .select(EVENT_SELECT)
    .eq("consultant_id", consultantId)
    .gte("started_at", dayStart)
    .lte("started_at", dayEnd);

  if (error) throw error;
  return (data ?? []) as unknown as ActivityEventWithJoins[];
}
