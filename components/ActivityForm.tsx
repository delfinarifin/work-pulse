"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { logActivity, suggestClassification, type LogActivityState } from "@/app/activities/new/actions";
import type { BillableStatus, Client, EngagementWithJoins, Service, Task } from "@/lib/types";

const initialState: LogActivityState = { error: null };

const BILLABLE_OPTIONS: { value: BillableStatus; label: string }[] = [
  { value: "billable", label: "Billable" },
  { value: "non_billable", label: "Non-billable" },
  { value: "internal", label: "Internal" },
  { value: "training", label: "Training" },
  { value: "administration", label: "Administration" },
];

export default function ActivityForm({
  clients,
  services,
  tasks,
  engagements,
}: {
  clients: Client[];
  services: Service[];
  tasks: Task[];
  engagements: EngagementWithJoins[];
}) {
  const [state, formAction, pending] = useActionState(logActivity, initialState);
  const [clientId, setClientId] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [billableStatus, setBillableStatus] = useState<BillableStatus>("billable");
  const [suggestion, setSuggestion] = useState<{
    confidence: number;
    clientName: string | null;
    serviceName: string | null;
    taskName: string | null;
  } | null>(null);
  const [isSuggesting, startSuggesting] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleFileNameChange(fileName: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!fileName.trim()) {
      setSuggestion(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSuggesting(async () => {
        const result = await suggestClassification(fileName);
        if (!result) {
          setSuggestion(null);
          return;
        }
        if (result.clientId) setClientId(result.clientId);
        if (result.serviceId) setServiceId(result.serviceId);
        if (result.taskId) setTaskId(result.taskId);
        setSuggestion({
          confidence: result.overallConfidence,
          clientName: clients.find((c) => c.id === result.clientId)?.name ?? null,
          serviceName: services.find((s) => s.id === result.serviceId)?.name ?? null,
          taskName: tasks.find((t) => t.id === result.taskId)?.name ?? null,
        });
      });
    }, 400);
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2"
        >
          {state.error}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="file_name" className="text-sm font-medium">
          File name
        </label>
        <input
          id="file_name"
          name="file_name"
          type="text"
          required
          placeholder="Client_ABC_Tax_Return_2024.xlsx"
          onChange={(e) => handleFileNameChange(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {isSuggesting && (
          <p className="text-xs text-neutral-400">Detecting client/service/task…</p>
        )}
        {!isSuggesting && suggestion && (suggestion.clientName || suggestion.serviceName || suggestion.taskName) && (
          <p className="text-xs text-neutral-500">
            We detected{" "}
            <span className="font-medium text-neutral-700">
              {[suggestion.clientName, suggestion.serviceName, suggestion.taskName]
                .filter(Boolean)
                .join(" – ")}
            </span>{" "}
            ({Math.round(suggestion.confidence * 100)}% confidence). Adjust below if needed.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="client_id" className="text-sm font-medium">
            Client
          </label>
          <select
            id="client_id"
            name="client_id"
            value={clientId}
            onChange={(e) => {
              const nextClientId = e.target.value;
              setClientId(nextClientId);
              const stillValid = engagements.some(
                (eng) => eng.id === engagementId && eng.client_id === nextClientId,
              );
              if (!stillValid) setEngagementId("");
            }}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="engagement_id" className="text-sm font-medium">
            Engagement
          </label>
          <select
            id="engagement_id"
            name="engagement_id"
            value={engagementId}
            onChange={(e) => setEngagementId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">No engagement</option>
            {engagements
              .filter((eng) => !clientId || eng.client_id === clientId)
              .map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="service_id" className="text-sm font-medium">
            Service
          </label>
          <select
            id="service_id"
            name="service_id"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Not set</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="task_id" className="text-sm font-medium">
            Task
          </label>
          <select
            id="task_id"
            name="task_id"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Not set</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="billable_status" className="text-sm font-medium">
          Billable status
        </label>
        <select
          id="billable_status"
          name="billable_status"
          value={billableStatus}
          onChange={(e) => setBillableStatus(e.target.value as BillableStatus)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm sm:w-56"
        >
          {BILLABLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="started_at" className="text-sm font-medium">
            Start
          </label>
          <input
            id="started_at"
            name="started_at"
            type="datetime-local"
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="ended_at" className="text-sm font-medium">
            End
          </label>
          <input
            id="ended_at"
            name="ended_at"
            type="datetime-local"
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Logging…" : "Log Activity"}
      </button>
    </form>
  );
}
