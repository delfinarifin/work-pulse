"use server";

import { revalidatePath } from "next/cache";
import { getCurrentConsultant } from "@/lib/data/consultants";
import { createWorkJournalEntry, deleteWorkJournalEntry } from "@/lib/data/work-journal";
import type { JournalVisibility } from "@/lib/types";

const VISIBILITIES: JournalVisibility[] = ["private", "manager", "client"];

export type JournalFormState = { error: string | null };

export async function createJournalEntryAction(
  _prevState: JournalFormState,
  formData: FormData,
): Promise<JournalFormState> {
  const date = String(formData.get("date") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const client_id = String(formData.get("client_id") ?? "").trim() || null;
  const engagement_id = String(formData.get("engagement_id") ?? "").trim() || null;
  const visibilityRaw = String(formData.get("visibility") ?? "private");
  const visibility = VISIBILITIES.includes(visibilityRaw as JournalVisibility)
    ? (visibilityRaw as JournalVisibility)
    : "private";

  if (!date) return { error: "Date is required." };
  if (!content) return { error: "Entry content is required." };

  const consultant = await getCurrentConsultant();
  if (!consultant) return { error: "You must be signed in to write a journal entry." };

  await createWorkJournalEntry({
    consultant_id: consultant.id,
    date,
    content,
    client_id,
    engagement_id,
    visibility,
  });

  revalidatePath("/journal");
  return { error: null };
}

export async function deleteJournalEntryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteWorkJournalEntry(id);
  revalidatePath("/journal");
}
