"use client";

import { useState } from "react";
import {
  changeSessionAction,
  deleteSessionAction,
  mergeSessionsAction,
} from "@/app/activities/actions";
import type { ActivitySessionWithJoins, BillableStatus, Client, Service, Task } from "@/lib/types";

const BILLABLE_LABELS: Record<BillableStatus, string> = {
  billable: "Billable",
  non_billable: "Non-billable",
  internal: "Internal",
  training: "Training",
  administration: "Administration",
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export default function ActivityLogTable({
  sessions,
  clients,
  services,
  tasks,
}: {
  sessions: ActivitySessionWithJoins[];
  clients: Client[];
  services: Service[];
  tasks: Task[];
}) {
  const [changingId, setChangingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2),
    );
  }

  return (
    <div className="space-y-2">
      {selectedIds.length === 2 && (
        <form
          action={async (formData) => {
            await mergeSessionsAction(formData);
            setSelectedIds([]);
          }}
          className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
        >
          <input type="hidden" name="source_id" value={selectedIds[0]} />
          <input type="hidden" name="target_id" value={selectedIds[1]} />
          <span className="text-neutral-600">2 activities selected —</span>
          <button type="submit" className="rounded bg-neutral-900 text-white px-2 py-1 text-xs font-medium">
            Merge into one
          </button>
          <button type="button" onClick={() => setSelectedIds([])} className="text-xs text-neutral-500">
            Cancel
          </button>
        </form>
      )}
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium"></th>
            <th className="px-4 py-2 font-medium">File</th>
            <th className="px-4 py-2 font-medium">Client</th>
            <th className="px-4 py-2 font-medium">Service</th>
            <th className="px-4 py-2 font-medium">Task</th>
            <th className="px-4 py-2 font-medium">Billable</th>
            <th className="px-4 py-2 font-medium">Duration</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {sessions.map((session) => (
            <tr key={session.id} className={session.review_status === "ignored" ? "opacity-50" : ""}>
              <td className="px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(session.id)}
                  onChange={() => toggleSelected(session.id)}
                  aria-label="Select for merge"
                />
              </td>
              <td className="px-4 py-2.5 font-medium max-w-48 truncate" title={session.file_name ?? ""}>
                {session.file_name ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-neutral-600">{session.client?.name ?? "—"}</td>
              <td className="px-4 py-2.5 text-neutral-600">{session.service?.name ?? "—"}</td>
              <td className="px-4 py-2.5 text-neutral-600">{session.task?.name ?? "—"}</td>
              <td className="px-4 py-2.5 text-neutral-600">{BILLABLE_LABELS[session.billable_status]}</td>
              <td className="px-4 py-2.5 text-neutral-600">
                {formatDuration(session.active_duration_minutes)}
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge session={session} />
              </td>
              <td className="px-4 py-2.5">
                {changingId === session.id ? (
                  <ChangeForm
                    session={session}
                    clients={clients}
                    services={services}
                    tasks={tasks}
                    onDone={() => setChangingId(null)}
                  />
                ) : (
                  <RowActions
                    session={session}
                    onChange={() => setChangingId(session.id)}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function StatusBadge({ session }: { session: ActivitySessionWithJoins }) {
  if (session.review_status === "confirmed") {
    return <span className="text-xs text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">Confirmed</span>;
  }
  if (session.review_status === "changed") {
    return <span className="text-xs text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">Corrected</span>;
  }
  if (session.review_status === "ignored") {
    return <span className="text-xs text-neutral-500 bg-neutral-100 rounded-full px-2 py-0.5">Ignored</span>;
  }
  const confidence = session.classification_confidence;
  return (
    <span className="text-xs text-neutral-600 bg-neutral-100 rounded-full px-2 py-0.5">
      Unreviewed{typeof confidence === "number" ? ` · ${Math.round(confidence * 100)}%` : ""}
    </span>
  );
}

// Simplified per explicit request — no Confirm/Ignore step, just Change
// (always available, any review_status) and Delete (always available).
function RowActions({
  session,
  onChange,
}: {
  session: ActivitySessionWithJoins;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onChange}
        className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-50"
      >
        Change
      </button>
      <form action={deleteSessionAction}>
        <input type="hidden" name="id" value={session.id} />
        <button
          type="submit"
          onClick={(e) => {
            if (!window.confirm("Delete this activity?")) e.preventDefault();
          }}
          className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </form>
    </div>
  );
}

function ChangeForm({
  session,
  clients,
  services,
  tasks,
  onDone,
}: {
  session: ActivitySessionWithJoins;
  clients: Client[];
  services: Service[];
  tasks: Task[];
  onDone: () => void;
}) {
  return (
    <form
      action={async (formData) => {
        await changeSessionAction(formData);
        onDone();
      }}
      className="flex flex-col gap-1.5 min-w-56"
    >
      <input type="hidden" name="id" value={session.id} />
      <select name="client_id" defaultValue={session.client_id ?? ""} className="rounded border border-neutral-300 px-1.5 py-1 text-xs">
        <option value="">No client</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select name="service_id" defaultValue={session.service_id ?? ""} className="rounded border border-neutral-300 px-1.5 py-1 text-xs">
        <option value="">Not set</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select name="task_id" defaultValue={session.task_id ?? ""} className="rounded border border-neutral-300 px-1.5 py-1 text-xs">
        <option value="">Not set</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <select name="billable_status" defaultValue={session.billable_status} className="rounded border border-neutral-300 px-1.5 py-1 text-xs">
        {Object.entries(BILLABLE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button type="submit" className="rounded bg-neutral-900 text-white px-2 py-1 text-xs font-medium">
          Save
        </button>
        <button type="button" onClick={onDone} className="text-xs text-neutral-500">
          Cancel
        </button>
      </div>
    </form>
  );
}
