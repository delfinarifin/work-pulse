import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Accepts an optional injected client + user_id, same reason as
// listActivitySessionsForConsultantOnDate / runSessionAggregationForConsultantDate
// — callers with no cookie session (the agent's heartbeat path, which has
// no browser session to derive a user from) pass both explicitly. Without
// this, this function's own cookie-based client sees no authenticated
// user, and the audit_logs insert violates RLS (auth.uid() = user_id both
// null does not satisfy the check) — a real bug hit in production once a
// session actually closed via the agent.
export async function writeAuditLog(
  entry: {
    action: string;
    entity: string;
    entity_id: string | null;
    details?: Record<string, unknown>;
  },
  client?: SupabaseClient,
  userId?: string | null,
): Promise<void> {
  const supabase = client ?? (await createClient());
  const resolvedUserId = client
    ? (userId ?? null)
    : ((await supabase.auth.getUser()).data.user?.id ?? null);

  const { error } = await supabase
    .from("audit_logs")
    .insert({ ...entry, user_id: resolvedUserId });
  if (error) throw error;
}
