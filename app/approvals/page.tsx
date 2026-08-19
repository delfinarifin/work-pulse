import type { ReactNode } from "react";
import { getCurrentConsultant } from "@/lib/data/consultants";
import { listSubmissionsByStatus } from "@/lib/data/timesheet-submissions";
import { listTimesheetEntries } from "@/lib/data/timesheets";
import { ApproveRejectControls, ReopenControl } from "@/components/ApprovalActions";
import type { TimesheetSubmissionWithJoins } from "@/lib/types";

function SubmissionRow({
  submission,
  totalMinutes,
  action,
}: {
  submission: TimesheetSubmissionWithJoins;
  totalMinutes: number;
  action: ReactNode;
}) {
  return (
    <tr key={submission.id}>
      <td className="px-4 py-2.5 font-medium">{submission.consultant?.name ?? "—"}</td>
      <td className="px-4 py-2.5 text-neutral-600">{submission.consultant?.job_role ?? "—"}</td>
      <td className="px-4 py-2.5 text-neutral-600">
        {submission.period_start} – {submission.period_end}
      </td>
      <td className="px-4 py-2.5 text-neutral-600">{Math.round((totalMinutes / 60) * 10) / 10}h</td>
      <td className="px-4 py-2.5 text-neutral-600">{submission.submitted_at?.slice(0, 10) ?? "—"}</td>
      <td className="px-4 py-2.5">{action}</td>
    </tr>
  );
}

export default async function ApprovalsPage() {
  const consultant = await getCurrentConsultant();
  if (!consultant) {
    return <p className="text-sm text-neutral-500">Sign in to view approvals.</p>;
  }
  if (consultant.role !== "manager" && consultant.role !== "admin") {
    return (
      <p className="text-sm text-neutral-500">
        Manager or admin access required to review timesheet submissions.
      </p>
    );
  }

  const [pending, approved, entries] = await Promise.all([
    listSubmissionsByStatus("submitted"),
    listSubmissionsByStatus("approved"),
    listTimesheetEntries(),
  ]);

  const totalsBySubmission = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.submission_id) continue;
    totalsBySubmission.set(
      entry.submission_id,
      (totalsBySubmission.get(entry.submission_id) ?? 0) + entry.duration_minutes,
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
        <p className="text-sm text-neutral-500">
          Review submitted timesheets — entries lock once approved and stay locked until
          reopened.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">
          Pending approval ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-neutral-400">Nothing waiting on you right now.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Consultant</th>
                  <th className="px-4 py-2 font-medium">Job Role</th>
                  <th className="px-4 py-2 font-medium">Period</th>
                  <th className="px-4 py-2 font-medium">Hours</th>
                  <th className="px-4 py-2 font-medium">Submitted</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pending.map((s) => (
                  <SubmissionRow
                    key={s.id}
                    submission={s}
                    totalMinutes={totalsBySubmission.get(s.id) ?? 0}
                    action={<ApproveRejectControls submissionId={s.id} />}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">
          Approved ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <p className="text-sm text-neutral-400">No approved timesheets yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Consultant</th>
                  <th className="px-4 py-2 font-medium">Job Role</th>
                  <th className="px-4 py-2 font-medium">Period</th>
                  <th className="px-4 py-2 font-medium">Hours</th>
                  <th className="px-4 py-2 font-medium">Submitted</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {approved.map((s) => (
                  <SubmissionRow
                    key={s.id}
                    submission={s}
                    totalMinutes={totalsBySubmission.get(s.id) ?? 0}
                    action={<ReopenControl submissionId={s.id} />}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
