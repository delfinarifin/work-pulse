const CATEGORY_COLORS: Record<string, string> = {
  tax: "bg-blue-50 text-blue-700 border-blue-200",
  accounting: "bg-purple-50 text-purple-700 border-purple-200",
  other: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export default function WorkTypeBadge({
  label,
  category,
  confidence,
}: {
  label: string;
  category?: string | null;
  confidence?: number | null;
}) {
  const colorClass = CATEGORY_COLORS[category ?? "other"] ?? CATEGORY_COLORS.other;
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
