import { getCurrentConsultant, listActiveConsultants } from "@/lib/data/consultants";
import { listEngagements } from "@/lib/data/engagements";
import { listClients } from "@/lib/data/clients";
import { listServices } from "@/lib/data/services";
import { updateEngagementStatusAction } from "@/app/engagements/actions";
import EngagementForm from "@/components/EngagementForm";

const STATUS_OPTIONS = ["active", "on_hold", "completed", "cancelled"] as const;

export default async function EngagementsPage() {
  const consultant = await getCurrentConsultant();
  if (!consultant) {
    return <p className="text-sm text-neutral-500">Sign in to view engagements.</p>;
  }

  const isManagerOrAdmin = consultant.role === "manager" || consultant.role === "admin";
  const [engagements, clients, services, consultants] = await Promise.all([
    listEngagements(),
    listClients(),
    listServices(),
    isManagerOrAdmin ? listActiveConsultants() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Engagements</h1>
        <p className="text-sm text-neutral-500">
          Bounded pieces of client work — the unit Log Activity, profitability, and capacity
          planning roll up against.
        </p>
      </div>

      {isManagerOrAdmin && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-700">New engagement</h2>
          <EngagementForm clients={clients} services={services} consultants={consultants} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">All engagements ({engagements.length})</h2>
        {engagements.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No engagements yet.{" "}
            {isManagerOrAdmin ? "Create one above." : "Ask a manager or admin to create one."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Client</th>
                  <th className="px-4 py-2 font-medium">Service</th>
                  <th className="px-4 py-2 font-medium">Partner</th>
                  <th className="px-4 py-2 font-medium">Manager</th>
                  <th className="px-4 py-2 font-medium">Budget</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {engagements.map((eng) => (
                  <tr key={eng.id}>
                    <td className="px-4 py-2.5 text-neutral-700">{eng.name}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{eng.client?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{eng.service?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{eng.engagement_partner?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{eng.manager?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-neutral-600">
                      {eng.budget_hours ? `${eng.budget_hours}h` : ""}
                      {eng.budget_hours && eng.budget_amount ? " / " : ""}
                      {eng.budget_amount ? `$${eng.budget_amount.toLocaleString()}` : ""}
                      {!eng.budget_hours && !eng.budget_amount ? "—" : ""}
                    </td>
                    <td className="px-4 py-2.5">
                      {isManagerOrAdmin ? (
                        <form action={updateEngagementStatusAction} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={eng.id} />
                          <select
                            name="status"
                            defaultValue={eng.status}
                            className="rounded border border-neutral-300 px-2 py-1 text-xs"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s.replace("_", " ")}</option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded bg-neutral-900 px-2 py-1 text-xs font-medium text-white hover:bg-neutral-700"
                          >
                            Save
                          </button>
                        </form>
                      ) : (
                        <span className="text-neutral-600">{eng.status.replace("_", " ")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
