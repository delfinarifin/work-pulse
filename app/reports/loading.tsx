export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 rounded bg-neutral-100 animate-pulse" />
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <div className="h-4 w-4 rounded-full border-2 border-neutral-300 border-t-neutral-600 animate-spin" />
        Loading time data…
      </div>
    </div>
  );
}
