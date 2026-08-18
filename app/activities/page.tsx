import Link from "next/link";
import { listActivitySessions } from "@/lib/data/sessions";
import { listClients } from "@/lib/data/clients";
import { listServices } from "@/lib/data/services";
import { listTasks } from "@/lib/data/tasks";
import ActivityLogTable from "@/components/ActivityLogTable";

export default async function ActivitiesPage() {
  const [sessions, clients, services, tasks] = await Promise.all([
    listActivitySessions(),
    listClients(),
    listServices(),
    listTasks(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-sm text-neutral-500">
            Recently captured activity, classified by client, service, and task.
          </p>
        </div>
        <Link
          href="/activities/new"
          className="shrink-0 rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium"
        >
          Log Activity
        </Link>
      </div>

      {sessions.length === 0 ? (
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
        <ActivityLogTable sessions={sessions} clients={clients} services={services} tasks={tasks} />
      )}
    </div>
  );
}
