import { createClient } from "@/lib/supabase/server";
import type { BillableStatus } from "@/lib/types";

export type ReportFilters = {
  consultantId?: string;
  clientId?: string;
  workTypeId?: string;
  serviceId?: string;
  taskId?: string;
  billableStatus?: string;
  startDate?: string;
  endDate?: string;
};

export type ReportRow = {
  entry_id: string;
  date: string;
  consultant_id: string;
  consultant_name: string;
  job_role: string | null;
  client_name: string | null;
  work_type_name: string;
  service_name: string | null;
  task_name: string | null;
  billable_status: BillableStatus;
  duration_minutes: number;
  source: string;
};

const ROW_SELECT =
  "id, date, duration_minutes, source, billable_status, consultant:consultants(id, name, job_role), client:clients(name), work_type:work_types(name), service:services(name), task:tasks(name)";

export async function listReportRows(
  filters: ReportFilters = {},
): Promise<ReportRow[]> {
  const supabase = await createClient();
  let query = supabase.from("timesheet_entries").select(ROW_SELECT);

  if (filters.consultantId) {
    query = query.eq("consultant_id", filters.consultantId);
  }
  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }
  if (filters.workTypeId) {
    query = query.eq("work_type_id", filters.workTypeId);
  }
  if (filters.serviceId) {
    query = query.eq("service_id", filters.serviceId);
  }
  if (filters.taskId) {
    query = query.eq("task_id", filters.taskId);
  }
  if (filters.billableStatus) {
    query = query.eq("billable_status", filters.billableStatus);
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
      duration_minutes: number;
      source: string;
      billable_status: BillableStatus;
      consultant: { id: string; name: string; job_role: string } | null;
      client: { name: string } | null;
      work_type: { name: string } | null;
      service: { name: string } | null;
      task: { name: string } | null;
    };
    return {
      entry_id: r.id,
      date: r.date,
      consultant_id: r.consultant?.id ?? "",
      consultant_name: r.consultant?.name ?? "Unknown",
      job_role: r.consultant?.job_role ?? null,
      client_name: r.client?.name ?? null,
      work_type_name: r.work_type?.name ?? "Unclassified",
      service_name: r.service?.name ?? null,
      task_name: r.task?.name ?? null,
      billable_status: r.billable_status,
      duration_minutes: r.duration_minutes,
      source: r.source,
    };
  });
}
