import Link from "next/link";
import { listActivities } from "@/lib/data/activities";

export default async function DashboardPage() {
  const activities = await listActivities(200);

  if (activities.length === 0) {
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

  const totalMinutes = Math.round(
    activities.reduce((sum, a) => sum + a.duration_seconds, 0) / 60,
  );
  const consultantCount = new Set(activities.map((a) => a.consultant_id)).size;

  const byWorkType = new Map<string, number>();
  for (const a of activities) {
    const label = a.work_type_value ?? "Unclassified";
    byWorkType.set(
      label,
      (byWorkType.get(label) ?? 0) + Math.round(a.duration_seconds / 60),
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-neutral-500">
          Time captured across all consultants.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total minutes logged" value={totalMinutes} />
        <StatCard label="Consultants active" value={consultantCount} />
        <StatCard label="Activities logged" value={activities.length} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">
          Minutes by work type
        </h2>
        <div className="space-y-2">
          {Array.from(byWorkType.entries())
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
                      width: `${Math.min(100, (minutes / totalMinutes) * 100)}%`,
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
