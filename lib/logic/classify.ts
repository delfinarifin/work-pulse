import type { WorkType } from "@/lib/types";

// Matches docs/INTELLIGENCE_LAYER.md — first match wins, in this priority order.
const PRIORITY_ORDER = [
  "Documentation",
  "Design",
  "Development",
  "Presentation",
  "Analysis",
];

export type ClassificationResult = {
  work_type_id: string | null;
  work_type_value: string;
  work_type_source: "rule-based";
  work_type_confidence: number;
};

export function classifyActivity(
  fileName: string,
  workTypes: WorkType[],
): ClassificationResult {
  const name = fileName.toLowerCase();
  const byLabel = new Map(workTypes.map((wt) => [wt.label, wt]));

  for (const label of PRIORITY_ORDER) {
    const workType = byLabel.get(label);
    if (!workType) continue;
    const matched = workType.keywords.some((keyword) =>
      name.includes(keyword.toLowerCase()),
    );
    if (matched) {
      return {
        work_type_id: workType.id,
        work_type_value: workType.label,
        work_type_source: "rule-based",
        work_type_confidence: confidenceFor(workType.label),
      };
    }
  }

  const unclassified = byLabel.get("Unclassified");
  return {
    work_type_id: unclassified?.id ?? null,
    work_type_value: "Unclassified",
    work_type_source: "rule-based",
    work_type_confidence: 0.3,
  };
}

function confidenceFor(label: string): number {
  switch (label) {
    case "Documentation":
      return 0.85;
    case "Design":
      return 0.8;
    case "Development":
      return 0.9;
    case "Presentation":
      return 0.85;
    case "Analysis":
      return 0.8;
    default:
      return 0.3;
  }
}
