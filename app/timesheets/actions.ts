"use server";

import { revalidatePath } from "next/cache";
import { deleteTimesheetEntry, editTimesheetEntry } from "@/lib/data/timesheets";
import { createClient } from "@/lib/supabase/server";
import type { BillableStatus } from "@/lib/types";

const BILLABLE_STATUSES: BillableStatus[] = [
  "billable",
  "non_billable",
  "internal",
  "training",
  "administration",
];

export async function editEntryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const work_type_id = String(formData.get("work_type_id") ?? "");
  const service_id = String(formData.get("service_id") ?? "").trim();
  const task_id = String(formData.get("task_id") ?? "").trim();
  const billable_status = String(formData.get("billable_status") ?? "");
  const duration_minutes = Number(formData.get("duration_minutes") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id || !work_type_id || !Number.isFinite(duration_minutes) || duration_minutes < 0) {
    return;
  }

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("timesheet_entries")
    .select("work_type_id, service_id, task_id, billable_status, duration_minutes, notes")
    .eq("id", id)
    .single();

  await editTimesheetEntry(
    id,
    {
      work_type_id,
      service_id: service_id || null,
      task_id: task_id || null,
      billable_status: BILLABLE_STATUSES.includes(billable_status as BillableStatus)
        ? (billable_status as BillableStatus)
        : "billable",
      duration_minutes,
      notes: notes || null,
    },
    before ?? {},
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
