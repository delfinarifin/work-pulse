import { createClient } from "@/lib/supabase/server";
import type { JournalVisibility, WorkJournalEntryWithJoins } from "@/lib/types";
import { writeAuditLog } from "@/lib/data/audit-logs";

const ENTRY_SELECT =
  "*, consultant:consultants(id, name), engagement:engagements(id, name), client:clients(id, name)";

export async function listWorkJournalEntries(
  consultantId: string,
): Promise<WorkJournalEntryWithJoins[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_journal_entries")
    .select(ENTRY_SELECT)
    .eq("consultant_id", consultantId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as WorkJournalEntryWithJoins[];
}

export type NewWorkJournalEntry = {
  consultant_id: string;
  date: string;
  content: string;
  engagement_id: string | null;
  client_id: string | null;
  visibility: JournalVisibility;
};

export async function createWorkJournalEntry(
  entry: NewWorkJournalEntry,
): Promise<WorkJournalEntryWithJoins> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("work_journal_entries")
    .insert({ ...entry, user_id: user?.id ?? null })
    .select(ENTRY_SELECT)
    .single();

  if (error) throw error;
  const created = data as unknown as WorkJournalEntryWithJoins;

  await writeAuditLog({
    action: "journal.create",
    entity: "work_journal_entries",
    entity_id: created.id,
    details: { date: created.date, visibility: created.visibility },
  });

  return created;
}

export async function deleteWorkJournalEntry(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("work_journal_entries").delete().eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    action: "journal.delete",
    entity: "work_journal_entries",
    entity_id: id,
  });
}
