"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Consultant, WorkType } from "@/lib/types";

export default function ReportFiltersForm({
  consultants,
  workTypes,
}: {
  consultants: Consultant[];
  workTypes: WorkType[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label htmlFor="consultant" className="text-xs font-medium text-neutral-600">
          Consultant
        </label>
        <select
          id="consultant"
          defaultValue={searchParams.get("consultant") ?? ""}
          onChange={(e) => updateParam("consultant", e.target.value)}
          className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
        >
          <option value="">All consultants</option>
          {consultants.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="workType" className="text-xs font-medium text-neutral-600">
          Work type
        </label>
        <select
          id="workType"
          defaultValue={searchParams.get("workType") ?? ""}
          onChange={(e) => updateParam("workType", e.target.value)}
          className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
        >
          <option value="">All work types</option>
          {workTypes.map((wt) => (
            <option key={wt.id} value={wt.id}>
              {wt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="start" className="text-xs font-medium text-neutral-600">
          From
        </label>
        <input
          id="start"
          type="date"
          defaultValue={searchParams.get("start") ?? ""}
          onChange={(e) => updateParam("start", e.target.value)}
          className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="end" className="text-xs font-medium text-neutral-600">
          To
        </label>
        <input
          id="end"
          type="date"
          defaultValue={searchParams.get("end") ?? ""}
          onChange={(e) => updateParam("end", e.target.value)}
          className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
        />
      </div>

      {searchParams.toString() && (
        <button
          type="button"
          onClick={() => router.push("/reports")}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
