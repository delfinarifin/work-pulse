import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateApiKey } from "@/lib/agent/auth";

// No Supabase Auth session here — the agent isn't a logged-in browser, it's
// exchanging a short-lived human-entered pairing code for a long-lived API
// key. Uses the service-role client because of that; the pairing_code +
// status='pending' + not-expired filter IS the authorization check, done
// explicitly in this route rather than relied on from RLS.
export async function POST(request: Request) {
  let body: { pairing_code?: string; platform?: string; agent_version?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pairingCode = (body.pairing_code ?? "").trim().toUpperCase();
  if (!pairingCode) {
    return NextResponse.json({ error: "pairing_code is required" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: device, error: lookupError } = await service
    .from("devices")
    .select("id, consultant_id")
    .eq("pairing_code", pairingCode)
    .eq("status", "pending")
    .gt("pairing_code_expires_at", new Date().toISOString())
    .maybeSingle();

  if (lookupError) {
    console.error("agent pair lookup failed", lookupError);
    return NextResponse.json({ error: "Lookup failed", detail: lookupError.message }, { status: 500 });
  }
  if (!device) {
    return NextResponse.json({ error: "Invalid or expired pairing code" }, { status: 401 });
  }

  const { raw, hash, prefix } = generateApiKey();

  const { error: updateError } = await service
    .from("devices")
    .update({
      status: "active",
      api_key_hash: hash,
      api_key_prefix: prefix,
      pairing_code: null,
      pairing_code_expires_at: null,
      platform: body.platform ?? null,
      agent_version: body.agent_version ?? null,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", device.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to activate device" }, { status: 500 });
  }

  // api_key is returned exactly once — the agent must store it locally
  // (only its hash is kept server-side, same as a password).
  return NextResponse.json({ device_id: device.id, api_key: raw });
}
