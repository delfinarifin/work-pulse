import Link from "next/link";
import { listTimesheetEntries } from "@/lib/data/timesheets";
import { listWorkTypes } from "@/lib/data/work-types";
import { listServices } from "@/lib/data/services";
import { listTasks } from "@/lib/data/tasks";
import { getCurrentConsultant } from "@/lib/data/consultants";
import { listSubmissionsForConsultant } from "@/lib/data/timesheet-submissions";
import TimesheetTable from "@/components/TimesheetTable";
import WeeklySubmissionPanel from "@/components/WeeklySubmissionPanel";

// Monday-start ISO week containing `date`.
function currentWeekRange(date = new Date()): { start: string; end: string } {
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
}

export default async function TimesheetsPage() {
  const consultant = await getCurrentConsultant();
  const [entries, workTypes, services, tasks, submissions] = await Promise.all([
    listTimesheetEntries(),
    listWorkTypes(),
    listServices(),
    listTasks(),
    consultant ? listSubmissionsForConsultant(consultant.id) : Promise.resolve([]),
  ]);

  const { start, end } = currentWeekRange();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Timesheets</h1>
        <p className="text-sm text-neutral-500">
          Daily entries aggregated from logged activity. Edit or delete each
          entry.
        </p>
      </div>

      {consultant && (
        <WeeklySubmissionPanel
          periodStart={start}
          periodEnd={end}
          submissions={submissions}
          entries={entries}
        />
      )}

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
