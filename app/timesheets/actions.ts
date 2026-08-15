"use server";

import { revalidatePath } from "next/cache";
import { approveTimesheetEntry, editTimesheetEntry } from "@/lib/data/timesheets";
import { createClient } from "@/lib/supabase/server";

export async function approveEntryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await approveTimesheetEntry(id);
  revalidatePath("/timesheets");
  revalidatePath("/");
  revalidatePath("/reports");
}

export async function editEntryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const work_type_id = String(formData.get("work_type_id") ?? "");
  const total_minutes = Number(formData.get("total_minutes") ?? 0);
  if (!id || !work_type_id || !Number.isFinite(total_minutes) || total_minutes < 0) {
    return;
  }

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("timesheet_entries")
    .select("work_type_id, total_minutes")
    .eq("id", id)
    .single();

  await editTimesheetEntry(
    id,
    { work_type_id, total_minutes },
    before ?? { work_type_id: null, total_minutes: 0 },
  );
  revalidatePath("/timesheets");
  revalidatePath("/");
  revalidatePath("/reports");
}
