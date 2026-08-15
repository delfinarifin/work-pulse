"use client";

import { useState } from "react";
import { deleteEntryAction, editEntryAction } from "@/app/timesheets/actions";
import type { TimesheetEntryWithJoins, WorkType } from "@/lib/types";

const SOURCE_STYLES: Record<string, string> = {
  auto: "bg-neutral-100 text-neutral-600",
  manual: "bg-amber-50 text-amber-700",
};

export default function TimesheetTable({
  entries,
  workTypes,
}: {
  entries: TimesheetEntryWithJoins[];
  workTypes: WorkType[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Consultant</th>
            <th className="px-4 py-2 font-medium">Job Role</th>
            <th className="px-4 py-2 font-medium">Client</th>
            <th className="px-4 py-2 font-medium">Work Type</th>
            <th className="px-4 py-2 font-medium">Minutes</th>
            <th className="px-4 py-2 font-medium">Source</th>
            <th className="px-4 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-2.5 text-neutral-600">{entry.date}</td>
              <td className="px-4 py-2.5 font-medium">
                {entry.consultant?.name ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-neutral-600">
                {entry.consultant?.job_role ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-neutral-600">
                {entry.client?.name ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-neutral-600">
                {entry.work_type?.name ?? "Unclassified"}
              </td>
              <td className="px-4 py-2.5 text-neutral-600">
                {entry.duration_minutes}m
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SOURCE_STYLES[entry.source]}`}
                >
                  {entry.source}
                </span>
              </td>
              <td className="px-4 py-2.5">
                {editingId === entry.id ? (
                  <form
                    action={async (formData) => {
                      await editEntryAction(formData);
                      setEditingId(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={entry.id} />
                    <select
                      name="work_type_id"
                      defaultValue={entry.work_type_id ?? ""}
                      className="rounded border border-neutral-300 px-1.5 py-1 text-xs"
                    >
                      {workTypes.map((wt) => (
                        <option key={wt.id} value={wt.id}>
                          {wt.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="duration_minutes"
                      min={0}
                      defaultValue={entry.duration_minutes}
                      className="w-16 rounded border border-neutral-300 px-1.5 py-1 text-xs"
                    />
                    <input
                      type="text"
                      name="notes"
                      placeholder="Notes"
                      defaultValue={entry.notes ?? ""}
                      className="w-28 rounded border border-neutral-300 px-1.5 py-1 text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded bg-neutral-900 text-white px-2 py-1 text-xs font-medium"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs text-neutral-500"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(entry.id)}
                      className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-50"
                    >
                      Edit
                    </button>
                    <form
                      action={async (formData) => {
                        if (!window.confirm("Delete this entry?")) return;
                        await deleteEntryAction(formData);
                      }}
                    >
                      <input type="hidden" name="id" value={entry.id} />
                      <button
                        type="submit"
                        className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
