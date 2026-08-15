"use server";

import { revalidatePath } from "next/cache";
import { deleteTimesheetEntry, editTimesheetEntry } from "@/lib/data/timesheets";
import { createClient } from "@/lib/supabase/server";

export async function editEntryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const work_type_id = String(formData.get("work_type_id") ?? "");
  const duration_minutes = Number(formData.get("duration_minutes") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id || !work_type_id || !Number.isFinite(duration_minutes) || duration_minutes < 0) {
    return;
  }

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("timesheet_entries")
    .select("work_type_id, duration_minutes, notes")
    .eq("id", id)
    .single();

  await editTimesheetEntry(
    id,
    { work_type_id, duration_minutes, notes: notes || null },
    before ?? { work_type_id: null, duration_minutes: 0, notes: null },
  );
  revalidatePath("/timesheets");
  revalidatePath("/");
  revalidatePath("/reports");
}

export async function deleteEntryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("timesheet_entries")
    .select("*")
    .eq("id", id)
    .single();

  await deleteTimesheetEntry(id, before ?? {});
  revalidatePath("/timesheets");
  revalidatePath("/");
  revalidatePath("/reports");
}
