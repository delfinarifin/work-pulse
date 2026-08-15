"use client";

import { useActionState } from "react";
import { logActivity, type LogActivityState } from "@/app/activities/new/actions";
import type { Client, Consultant } from "@/lib/types";

const initialState: LogActivityState = { error: null };

export default function ActivityForm({
  consultants,
  clients,
}: {
  consultants: Consultant[];
  clients: Client[];
}) {
  const [state, formAction, pending] = useActionState(
    logActivity,
    initialState,
  );

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
        <label htmlFor="consultant_id" className="text-sm font-medium">
          Consultant
        </label>
        <select
          id="consultant_id"
          name="consultant_id"
          required
          defaultValue=""
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a consultant
          </option>
          {consultants.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="client_id" className="text-sm font-medium">
          Client <span className="text-neutral-400">(optional)</span>
        </label>
        <select
          id="client_id"
          name="client_id"
          defaultValue=""
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
        <label htmlFor="file_name" className="text-sm font-medium">
          File name
        </label>
        <input
          id="file_name"
          name="file_name"
          type="text"
          required
          placeholder="Client_ABC_Tax_Return_2024.xlsx"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
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
