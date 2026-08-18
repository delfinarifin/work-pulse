import Link from "next/link";
import { listTimesheetEntries } from "@/lib/data/timesheets";
import { listWorkTypes } from "@/lib/data/work-types";
import { listServices } from "@/lib/data/services";
import { listTasks } from "@/lib/data/tasks";
import TimesheetTable from "@/components/TimesheetTable";

export default async function TimesheetsPage() {
  const [entries, workTypes, services, tasks] = await Promise.all([
    listTimesheetEntries(),
    listWorkTypes(),
    listServices(),
    listTasks(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Timesheets</h1>
        <p className="text-sm text-neutral-500">
          Daily entries aggregated from logged activity. Edit or delete each
          entry.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center space-y-3">
          <p className="text-neutral-500">
            No timesheet entries. Log activities to generate your daily
            timesheet.
          </p>
          <Link
            href="/activities/new"
            className="inline-block rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium"
          >
            Log Activity
          </Link>
        </div>
      ) : (
        <TimesheetTable entries={entries} workTypes={workTypes} services={services} tasks={tasks} />
      )}
    </div>
  );
}
