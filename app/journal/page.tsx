import { getCurrentConsultant } from "@/lib/data/consultants";
import { listWorkJournalEntries } from "@/lib/data/work-journal";
import { listClients } from "@/lib/data/clients";
import { listEngagements } from "@/lib/data/engagements";
import { deleteJournalEntryAction } from "@/app/journal/actions";
import JournalForm from "@/components/JournalForm";

export default async function JournalPage() {
  const consultant = await getCurrentConsultant();
  if (!consultant) {
    return <p className="text-sm text-neutral-500">Sign in to view your work journal.</p>;
  }

  const [entries, clients, engagements] = await Promise.all([
    listWorkJournalEntries(consultant.id),
    listClients(),
    listEngagements(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Work Journal</h1>
        <p className="text-sm text-neutral-500">
          Free-text notes about your day — separate from the auto-classified Activity Log.
          Private by default.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">New entry</h2>
        <JournalForm clients={clients} engagements={engagements} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Your entries ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-neutral-400">No entries yet — add your first one above.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-neutral-200 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="font-medium text-neutral-700">{entry.date}</span>
                    {entry.client && <span>· {entry.client.name}</span>}
                    {entry.engagement && <span>· {entry.engagement.name}</span>}
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600">
                      {entry.visibility}
                    </span>
                  </div>
                  <form action={deleteJournalEntryAction}>
                    <input type="hidden" name="id" value={entry.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </form>
                </div>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{entry.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
