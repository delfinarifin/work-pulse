import { getCurrentConsultant, listActiveConsultants } from "@/lib/data/consultants";
import { listConsultantCapacities, listResourceAllocations } from "@/lib/data/capacity";
import { listTimesheetEntries } from "@/lib/data/timesheets";
import { listEngagements } from "@/lib/data/engagements";
import { computeCapacityReport } from "@/lib/logic/capacity";
import { currentWeekRange } from "@/lib/logic/dates";
import { CapacityForm, AllocationForm } from "@/components/CapacityForms";

export default async function CapacityPage() {
  const consultant = await getCurrentConsultant();
  if (!consultant) {
    return <p className="text-sm text-neutral-500">Sign in to view capacity planning.</p>;
  }
  if (consultant.role !== "manager" && consultant.role !== "admin") {
    return (
      <p className="text-sm text-neutral-500">
        Manager or admin access required to view capacity planning.
      </p>
    );
  }

  const [consultants, capacities, allocations, entries, engagements] = await Promise.all([
    listActiveConsultants(),
    listConsultantCapacities(),
    listResourceAllocations(),
    listTimesheetEntries(),
    listEngagements(),
  ]);

  const { start, end } = currentWeekRange();
  const rows = computeCapacityReport(consultants, capacities, allocations, entries, start, end);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Capacity Planning</h1>
        <p className="text-sm text-neutral-500">
          Weekly capacity vs. planned allocation vs. actual logged hours — this week
          ({start} – {end}).
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Set weekly capacity</h2>
        <CapacityForm consultants={consultants} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Allocate to an engagement</h2>
        <AllocationForm consultants={consultants} engagements={engagements} defaultWeekStart={start} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">This week</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Consultant</th>
                <th className="px-4 py-2 font-medium">Capacity</th>
                <th className="px-4 py-2 font-medium">Allocated</th>
                <th className="px-4 py-2 font-medium">Actual</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((row) => (
                <tr key={row.consultantId}>
                  <td className="px-4 py-2.5 font-medium">{row.consultantName}</td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {row.capacityHours !== null ? `${row.capacityHours}h` : "Not set"}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">{row.allocatedHours}h</td>
                  <td className="px-4 py-2.5 text-neutral-600">{row.actualHours}h</td>
                  <td className="px-4 py-2.5">
                    {row.overAllocated ? (
                      <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        Over-allocated
                      </span>
                    ) : row.capacityHours === null ? (
                      <span className="text-xs text-neutral-400">—</span>
                    ) : (
                      <span className="inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        Within capacity
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
