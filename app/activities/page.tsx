import Link from "next/link";
import { listActivities } from "@/lib/data/activities";
import WorkTypeBadge from "@/components/WorkTypeBadge";

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export default async function ActivitiesPage() {
  const activities = await listActivities();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activities</h1>
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

      {activities.length === 0 ? (
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
                <th className="px-4 py-2 font-medium">App</th>
                <th className="px-4 py-2 font-medium">Work Type</th>
                <th className="px-4 py-2 font-medium">Duration</th>
                <th className="px-4 py-2 font-medium">Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-4 py-2.5 font-medium">
                    {activity.file_name}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {activity.consultant?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {activity.application}
                  </td>
                  <td className="px-4 py-2.5">
                    <WorkTypeBadge
                      label={activity.work_type_value ?? "Unclassified"}
                      category={activity.work_type?.category}
                      confidence={activity.work_type_confidence}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {formatDuration(activity.duration_seconds)}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-400">
                    {new Date(activity.started_at).toLocaleString()}
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
