"use server";

import { revalidatePath } from "next/cache";
import { getCurrentConsultant } from "@/lib/data/consultants";
import { createPendingDevice, revokeDevice } from "@/lib/data/devices";

export async function createDeviceAction(formData: FormData): Promise<void> {
  const deviceName = String(formData.get("device_name") ?? "").trim();
  if (!deviceName) return;

  const consultant = await getCurrentConsultant();
  if (!consultant) return;

  await createPendingDevice(consultant.id, deviceName);
  revalidatePath("/devices");
}

export async function revokeDeviceAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await revokeDevice(id);
  revalidatePath("/devices");
}
