import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { extractBearerToken, hashApiKey } from "@/lib/agent/auth";
import { recordHeartbeat, type HeartbeatPayload } from "@/lib/data/agent-sessions";
import type { Device } from "@/lib/types";

export async function POST(request: Request) {
  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: device, error: lookupError } = await service
    .from("devices")
    .select("*")
    .eq("api_key_hash", hashApiKey(token))
    .eq("status", "active")
    .maybeSingle<Device>();

  if (lookupError) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!device) {
    return NextResponse.json({ error: "Invalid or revoked device" }, { status: 401 });
  }

  let body: {
    application_name?: string | null;
    window_title?: string | null;
    file_name?: string | null;
    file_path?: string | null;
    is_idle?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload: HeartbeatPayload = {
    applicationName: body.application_name ?? null,
    windowTitle: body.window_title ?? null,
    fileName: body.file_name ?? null,
    filePath: body.file_path ?? null,
    isIdle: body.is_idle === true,
  };

  try {
    await recordHeartbeat(service, device, payload);
  } catch (err) {
    console.error("agent heartbeat failed", err);
    return NextResponse.json({ error: "Failed to record heartbeat" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
