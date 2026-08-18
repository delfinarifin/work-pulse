import { listReportRows } from "@/lib/data/reports";
import { listConsultants } from "@/lib/data/consultants";
import { listWorkTypes } from "@/lib/data/work-types";
import { listServices } from "@/lib/data/services";
import ReportFiltersForm from "@/components/ReportFiltersForm";

const BILLABLE_LABELS: Record<string, string> = {
  billable: "Billable",
  non_billable: "Non-billable",
  internal: "Internal",
  training: "Training",
  administration: "Administration",
};

type SearchParams = {
  consultant?: string;
  workType?: string;
  service?: string;
  billable?: string;
  start?: string;
  end?: string;
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [rows, consultants, workTypes, services] = await Promise.all([
    listReportRows({
      consultantId: params.consultant || undefined,
      workTypeId: params.workType || undefined,
      serviceId: params.service || undefined,
      billableStatus: params.billable || undefined,
      startDate: params.start || undefined,
      endDate: params.end || undefined,
    }),
    listConsultants(),
    listWorkTypes(),
    listServices(),
  ]);

  const totalMinutes = rows.reduce((sum, r) => sum + r.duration_minutes, 0);
  const billableMinutes = rows
    .filter((r) => r.billable_status === "billable")
    .reduce((sum, r) => sum + r.duration_minutes, 0);

  const byConsultant = new Map<string, { name: string; minutes: number }>();
  const byService = new Map<string, number>();
  const byJobRole = new Map<string, number>();
  const byBillableStatus = new Map<string, number>();

  for (const row of rows) {
    const c = byConsultant.get(row.consultant_id) ?? {
      name: row.consultant_name,
      minutes: 0,
    };
    c.minutes += row.duration_minutes;
    byConsultant.set(row.consultant_id, c);

    const serviceLabel = row.service_name ?? row.work_type_name;
    byService.set(serviceLabel, (byService.get(serviceLabel) ?? 0) + row.duration_minutes);

    const role = row.job_role ?? "Unassigned";
    byJobRole.set(role, (byJobRole.get(role) ?? 0) + row.duration_minutes);

    const billableLabel = BILLABLE_LABELS[row.billable_status] ?? row.billable_status;
    byBillableStatus.set(billableLabel, (byBillableStatus.get(billableLabel) ?? 0) + row.duration_minutes);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-neutral-500">
          Time spent by consultant, job role, service, and billable status.
        </p>
      </div>

      <ReportFiltersForm consultants={consultants} workTypes={workTypes} services={services} />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center">
          <p className="text-neutral-500">
            No results for the selected filters. Try a wider date range.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold tracking-tight">
                {totalMinutes}
              </div>
              <div className="text-sm text-neutral-500">Total minutes</div>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold tracking-tight">
                {billableMinutes}
              </div>
              <div className="text-sm text-neutral-500">Billable minutes</div>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold tracking-tight">
                {byConsultant.size}
              </div>
              <div className="text-sm text-neutral-500">Consultants</div>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold tracking-tight">
                {rows.length}
              </div>
              <div className="text-sm text-neutral-500">Entries</div>
            </div>
          </div>

          <ReportBreakdown title="By consultant" data={
            Array.from(byConsultant.values()).map((c) => [c.name, c.minutes] as [string, number])
          } />
          <ReportBreakdown title="By job role" data={Array.from(byJobRole.entries())} />
          <ReportBreakdown title="By service" data={Array.from(byService.entries())} />
          <ReportBreakdown title="By billable status" data={Array.from(byBillableStatus.entries())} />

          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Consultant</th>
                  <th className="px-4 py-2 font-medium">Job Role</th>
                  <th className="px-4 py-2 font-medium">Client</th>
                  <th className="px-4 py-2 font-medium">Service</th>
                  <th className="px-4 py-2 font-medium">Task</th>
                  <th className="px-4 py-2 font-medium">Billable</th>
                  <th className="px-4 py-2 font-medium">Minutes</th>
                  <th className="px-4 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => (
                  <tr key={row.entry_id}>
                    <td className="px-4 py-2.5 text-neutral-600">{row.date}</td>
                    <td className="px-4 py-2.5 font-medium">
                      {row.consultant_name}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">
                      {row.job_role ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">
                      {row.client_name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">
                      {row.service_name ?? row.work_type_name}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">
                      {row.task_name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">
                      {BILLABLE_LABELS[row.billable_status] ?? row.billable_status}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">
                      {row.duration_minutes}m
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600 capitalize">
                      {row.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportBreakdown({
  title,
  data,
}: {
  title: string;
  data: [string, number][];
}) {
  const max = Math.max(...data.map(([, m]) => m), 1);
  return (
    <div>
      <h2 className="text-sm font-semibold text-neutral-700 mb-3">{title}</h2>
      <div className="space-y-2">
        {data
          .sort((a, b) => b[1] - a[1])
          .map(([label, minutes]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm text-neutral-600 truncate">
                {label}
              </span>
              <div className="flex-1 h-3 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-neutral-900"
                  style={{ width: `${(minutes / max) * 100}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-sm text-neutral-500">
                {minutes}m
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
