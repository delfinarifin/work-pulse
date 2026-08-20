"use server";

import { revalidatePath } from "next/cache";
import { createNewClient, setClientActive } from "@/lib/data/clients";

function revalidateAll() {
  revalidatePath("/clients");
  revalidatePath("/activities/new");
  revalidatePath("/engagements");
  revalidatePath("/journal");
  revalidatePath("/profitability");
}

export async function createClientAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim() || null;
  if (!name) return;

  await createNewClient(name, companyName);
  revalidateAll();
}

export async function toggleClientActiveAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const nextActive = String(formData.get("active") ?? "") === "true";
  if (!id) return;

  await setClientActive(id, nextActive);
  revalidateAll();
}
