"use server";

import { revalidatePath } from "next/cache";
import { createNewClient } from "@/lib/data/clients";

export async function createClientAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim() || null;
  if (!name) return;

  await createNewClient(name, companyName);
  revalidatePath("/clients");
  revalidatePath("/activities/new");
  revalidatePath("/engagements");
}
