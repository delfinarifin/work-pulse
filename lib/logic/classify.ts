import type { WorkType } from "@/lib/types";

// work_types has no keywords column (v2 schema) — heuristics live in code.
// Matches docs/INTELLIGENCE_LAYER.md — first match wins, in this priority order.
const KEYWORDS_BY_WORK_TYPE: [string, string[]][] = [
  ["Tax Filing", ["tax", "spt", "pph", "ppn", "faktur", "return", "1040", "1120", "w2", "1099", "filing"]],
  ["Tax Planning", ["planning", "memo", "advisory", "strategy", "projection"]],
  ["Bookkeeping", ["ledger", "journal", "jurnal", "reconciliation", "recon", "gl", "coa", "books", "bookkeeping"]],
  ["Payroll", ["payroll", "salary", "wage", "gaji"]],
  ["Audit Prep", ["audit", "workpaper", "wp", "fieldwork", "engagement", "sampling", "prep"]],
];

const CONFIDENCE_BY_WORK_TYPE: Record<string, number> = {
  "Tax Filing": 0.85,
  "Tax Planning": 0.8,
  Bookkeeping: 0.85,
  Payroll: 0.9,
  "Audit Prep": 0.85,
};

export type ClassificationResult = {
  work_type_id: string | null;
  work_type_name: string | null;
  work_type_source: "rule-based";
  work_type_confidence: number;
};

export function classifyActivity(
  fileName: string,
  workTypes: WorkType[],
): ClassificationResult {
  const name = fileName.toLowerCase();
  const byName = new Map(workTypes.map((wt) => [wt.name, wt]));

  for (const [workTypeName, keywords] of KEYWORDS_BY_WORK_TYPE) {
    const workType = byName.get(workTypeName);
    if (!workType) continue;
    const matched = keywords.some((keyword) => name.includes(keyword));
    if (matched) {
      return {
        work_type_id: workType.id,
        work_type_name: workType.name,
        work_type_source: "rule-based",
        work_type_confidence: CONFIDENCE_BY_WORK_TYPE[workType.name] ?? 0.3,
      };
    }
  }

  return {
    work_type_id: null,
    work_type_name: null,
    work_type_source: "rule-based",
    work_type_confidence: 0.3,
  };
}
