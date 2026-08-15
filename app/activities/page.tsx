import Link from "next/link";
import { listActivityEvents } from "@/lib/data/activity-events";
import WorkTypeBadge from "@/components/WorkTypeBadge";

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return "—";
  const minutes = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000,
  );
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export default async function ActivitiesPage() {
  const events = await listActivityEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-sm text-neutral-500">
            Recently captured file activity, classified by work type.
          </p>
        </div>
        <Link
          href="/activities/new"
          className="shrink-0 rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium"
        >
          Log Activity
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center space-y-3">
          <p className="text-neutral-500">
            No activity data yet. Log your first activity to get started.
          </p>
          <Link
            href="/activities/new"
            className="inline-block rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium"
          >
            Log Activity
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">File</th>
                <th className="px-4 py-2 font-medium">Consultant</th>
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Work Type</th>
                <th className="px-4 py-2 font-medium">Duration</th>
                <th className="px-4 py-2 font-medium">Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-2.5 font-medium">
                    {event.file_name}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {event.consultant?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {event.client?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <WorkTypeBadge
                      label={event.work_type?.name ?? "Unclassified"}
                      category={event.work_type?.category}
                      confidence={event.work_type_confidence}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {formatDuration(event.started_at, event.ended_at)}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-400">
                    {new Date(event.started_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
