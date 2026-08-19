import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Only for server-side code
// that has no Supabase Auth session to act as (the desktop agent
// authenticates with its own API key, not a Supabase user), and which does
// its own authorization check before touching data. NEVER import this from
// a client component or expose SUPABASE_SERVICE_ROLE_KEY to the browser —
// it is not prefixed NEXT_PUBLIC_ for exactly that reason.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
