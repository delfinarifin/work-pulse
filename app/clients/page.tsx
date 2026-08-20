import { listClients } from "@/lib/data/clients";
import { createClientAction, toggleClientActiveAction } from "@/app/clients/actions";

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-sm text-neutral-500">
          Shared firm-wide — any consultant can add a client here so it shows up when logging
          activity or creating an engagement.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Add a client</h2>
        <form action={createClientAction} className="flex flex-wrap items-center gap-2 max-w-xl">
          <input
            type="text"
            name="name"
            placeholder="Client name"
            required
            className="flex-1 min-w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="company_name"
            placeholder="Company name (optional)"
            className="flex-1 min-w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium"
          >
            Add Client
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">All clients ({clients.length})</h2>
        {clients.length === 0 ? (
          <p className="text-sm text-neutral-400">No clients yet — add one above.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Company</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {clients.map((c) => (
                  <tr key={c.id} className={c.active ? "" : "opacity-50"}>
                    <td className="px-4 py-2.5 font-medium">{c.name}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{c.company_name ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.active ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {c.active ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <form action={toggleClientActiveAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="active" value={(!c.active).toString()} />
                        <button
                          type="submit"
                          className={`rounded border px-2 py-1 text-xs font-medium ${
                            c.active
                              ? "border-red-300 text-red-600 hover:bg-red-50"
                              : "border-green-300 text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {c.active ? "Archive" : "Reactivate"}
                        </button>
                      </form>
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
