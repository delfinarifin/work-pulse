import { createClient } from "@/lib/supabase/server";

export type ReportFilters = {
  consultantId?: string;
  workTypeId?: string;
  startDate?: string;
  endDate?: string;
};

export type ReportRow = {
  entry_id: string;
  date: string;
  consultant_id: string;
  consultant_name: string;
  job_role_title: string | null;
  work_type_label: string;
  total_minutes: number;
  status: string;
};

const ROW_SELECT =
  "id, date, total_minutes, status, consultant:consultants(id, name), job_role:job_roles(title), work_type:work_types(label)";

export async function listReportRows(
  filters: ReportFilters = {},
): Promise<ReportRow[]> {
  const supabase = await createClient();
  let query = supabase.from("timesheet_entries").select(ROW_SELECT);

  if (filters.consultantId) {
    query = query.eq("consultant_id", filters.consultantId);
  }
  if (filters.workTypeId) {
    query = query.eq("work_type_id", filters.workTypeId);
  }
  if (filters.startDate) {
    query = query.gte("date", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("date", filters.endDate);
  }

  const { data, error } = await query
    .order("date", { ascending: false })
    .limit(500);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string;
      date: string;
      total_minutes: number;
      status: string;
      consultant: { id: string; name: string } | null;
      job_role: { title: string } | null;
      work_type: { label: string } | null;
    };
    return {
      entry_id: r.id,
      date: r.date,
      consultant_id: r.consultant?.id ?? "",
      consultant_name: r.consultant?.name ?? "Unknown",
      job_role_title: r.job_role?.title ?? null,
      work_type_label: r.work_type?.label ?? "Unclassified",
      total_minutes: r.total_minutes,
      status: r.status,
    };
  });
}
