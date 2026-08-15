const CATEGORY_COLORS: Record<string, string> = {
  Writing: "bg-blue-50 text-blue-700 border-blue-200",
  Creative: "bg-purple-50 text-purple-700 border-purple-200",
  Engineering: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Communication: "bg-amber-50 text-amber-700 border-amber-200",
  Data: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Other: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export default function WorkTypeBadge({
  label,
  category,
  confidence,
}: {
  label: string;
  category?: string;
  confidence?: number | null;
}) {
  const colorClass = CATEGORY_COLORS[category ?? "Other"] ?? CATEGORY_COLORS.Other;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label}
      {typeof confidence === "number" && (
        <span className="opacity-60">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}
