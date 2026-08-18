import Link from "next/link";
import { listActivitySessions } from "@/lib/data/sessions";

export default async function DashboardPage() {
  const sessions = await listActivitySessions(200);

  if (sessions.length === 0) {
    return (
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
    );
  }

  let totalMinutes = 0;
  let billableMinutes = 0;
  const byService = new Map<string, number>();
  for (const session of sessions) {
    if (session.review_status === "ignored") continue;
    totalMinutes += session.active_duration_minutes;
    if (session.billable_status === "billable") billableMinutes += session.active_duration_minutes;
    const label = session.service?.name ?? "Unclassified";
    byService.set(label, (byService.get(label) ?? 0) + session.active_duration_minutes);
  }
  const consultantCount = new Set(sessions.map((s) => s.consultant_id)).size;
  const needsReviewCount = sessions.filter((s) => s.review_status === "unreviewed").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-neutral-500">
          Time captured across all consultants.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total minutes logged" value={totalMinutes} />
        <StatCard label="Billable minutes" value={billableMinutes} />
        <StatCard label="Consultants active" value={consultantCount} />
        <StatCard label="Awaiting review" value={needsReviewCount} />
      </div>

      {needsReviewCount > 0 && (
        <Link
          href="/activities"
          className="block rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {needsReviewCount} {needsReviewCount === 1 ? "activity needs" : "activities need"} a quick confirm →
        </Link>
      )}

      <div>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">
          Minutes by service
        </h2>
        <div className="space-y-2">
          {Array.from(byService.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([label, minutes]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-neutral-600">
                  {label}
                </span>
                <div className="flex-1 h-3 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-neutral-900"
                    style={{
                      width: `${totalMinutes === 0 ? 0 : Math.min(100, (minutes / totalMinutes) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-sm text-neutral-500">
                  {minutes}m
                </span>
              </div>
            ))}
        </div>
      </div>

      <Link
        href="/reports"
        className="inline-block text-sm font-medium text-neutral-900 underline underline-offset-4"
      >
        View full reports →
      </Link>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  );
}
