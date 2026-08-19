import { createClient } from "@/lib/supabase/server";
import type { Device } from "@/lib/types";
import { generatePairingCode } from "@/lib/agent/auth";
import { writeAuditLog } from "@/lib/data/audit-logs";

export async function listDevicesForConsultant(consultantId: string): Promise<Device[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("consultant_id", consultantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Creates a 'pending' device row with a short-lived pairing code — the
// agent exchanges this code (via POST /api/agent/pair) for a long-lived
// API key. Runs as the signed-in consultant (normal RLS, not the service
// client) since this is a browser action, not the agent talking to us.
export async function createPendingDevice(
  consultantId: string,
  deviceName: string,
): Promise<Device> {
  const supabase = await createClient();
  const { code, expiresAt } = generatePairingCode();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("devices")
    .insert({
      consultant_id: consultantId,
      device_name: deviceName,
      status: "pending",
      pairing_code: code,
      pairing_code_expires_at: expiresAt,
      user_id: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  await writeAuditLog({
    action: "device.pairing_code_create",
    entity: "devices",
    entity_id: data.id,
    details: { device_name: deviceName },
  });

  return data;
}

export async function revokeDevice(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("devices").update({ status: "revoked" }).eq("id", id);
  if (error) throw error;

  await writeAuditLog({ action: "device.revoke", entity: "devices", entity_id: id });
}
