export default function ActivitiesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 rounded bg-neutral-100 animate-pulse" />
      <div className="rounded-lg border border-neutral-200 divide-y divide-neutral-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-11 px-4 flex items-center gap-4">
            <div className="h-3 w-40 rounded bg-neutral-100 animate-pulse" />
            <div className="h-3 w-24 rounded bg-neutral-100 animate-pulse" />
            <div className="h-3 w-16 rounded bg-neutral-100 animate-pulse" />
            <div className="h-3 w-20 rounded bg-neutral-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
