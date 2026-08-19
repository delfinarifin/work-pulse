"use client";

import {
  generateDraftSubmissionAction,
  submitDraftSubmissionAction,
} from "@/app/timesheets/actions";
import type { TimesheetEntryWithJoins, TimesheetSubmissionWithJoins } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  submitted: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  locked: "bg-neutral-200 text-neutral-700",
};

export default function WeeklySubmissionPanel({
  periodStart,
  periodEnd,
  submissions,
  entries,
}: {
  periodStart: string;
  periodEnd: string;
  submissions: TimesheetSubmissionWithJoins[];
  entries: TimesheetEntryWithJoins[];
}) {
  const currentWeek = submissions.find(
    (s) => s.period_start === periodStart && s.period_end === periodEnd,
  );

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-neutral-700">
        This week ({periodStart} – {periodEnd})
      </h2>
      <div className="rounded-lg border border-neutral-200 p-4 flex flex-wrap items-center gap-3">
        {currentWeek ? (
          <>
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[currentWeek.status]}`}
            >
              {currentWeek.status}
            </span>
            {currentWeek.status === "rejected" && currentWeek.rejection_reason && (
              <span className="text-xs text-red-600">Reason: {currentWeek.rejection_reason}</span>
            )}
          </>
        ) : (
          <span className="text-sm text-neutral-400">No draft yet for this week.</span>
        )}

        {(!currentWeek || currentWeek.status === "draft" || currentWeek.status === "rejected") && (
          <form action={generateDraftSubmissionAction}>
            <input type="hidden" name="period_start" value={periodStart} />
            <input type="hidden" name="period_end" value={periodEnd} />
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
            >
              {currentWeek ? "Refresh draft" : "Generate this week's draft"}
            </button>
          </form>
        )}

        {currentWeek && (currentWeek.status === "draft" || currentWeek.status === "rejected") && (
          <form action={submitDraftSubmissionAction}>
            <input type="hidden" name="id" value={currentWeek.id} />
            <button
              type="submit"
              className="rounded-md bg-neutral-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-700"
            >
              Submit for approval
            </button>
          </form>
        )}
      </div>

      {submissions.length > 0 && (
        <details className="text-xs text-neutral-500">
          <summary className="cursor-pointer">Past submissions ({submissions.length})</summary>
          <ul className="mt-2 space-y-1">
            {submissions.map((s) => {
              const totalMinutes = entries
                .filter((e) => e.submission_id === s.id)
                .reduce((sum, e) => sum + e.duration_minutes, 0);
              return (
                <li key={s.id} className="flex items-center gap-2">
                  <span>{s.period_start} – {s.period_end}</span>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 font-medium capitalize ${STATUS_STYLES[s.status]}`}
                  >
                    {s.status}
                  </span>
                  <span>{Math.round((totalMinutes / 60) * 10) / 10}h</span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}
