"use client";

import { useActionState } from "react";
import { createJournalEntryAction, type JournalFormState } from "@/app/journal/actions";
import type { Client, EngagementWithJoins, JournalVisibility } from "@/lib/types";

const initialState: JournalFormState = { error: null };

const VISIBILITY_OPTIONS: { value: JournalVisibility; label: string }[] = [
  { value: "private", label: "Private (only me)" },
  { value: "manager", label: "Visible to managers" },
  { value: "client", label: "Visible to client (no client view built yet)" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function JournalForm({
  clients,
  engagements,
}: {
  clients: Client[];
  engagements: EngagementWithJoins[];
}) {
  const [state, formAction, pending] = useActionState(createJournalEntryAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label htmlFor="date" className="text-sm font-medium">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={todayISO()}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="client_id" className="text-sm font-medium">Client (optional)</label>
          <select id="client_id" name="client_id" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Not linked</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="engagement_id" className="text-sm font-medium">Engagement (optional)</label>
          <select id="engagement_id" name="engagement_id" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Not linked</option>
            {engagements.map((eng) => (
              <option key={eng.id} value={eng.id}>{eng.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="content" className="text-sm font-medium">Entry</label>
        <textarea
          id="content"
          name="content"
          required
          rows={4}
          placeholder="What did you actually work on today?"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="visibility" className="text-sm font-medium">Visibility</label>
        <select id="visibility" name="visibility" defaultValue="private" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm sm:w-72">
          {VISIBILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add Entry"}
      </button>
    </form>
  );
}
