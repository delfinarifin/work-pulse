"use client";

import { useActionState } from "react";
import { setCapacityAction, setAllocationAction, type CapacityFormState } from "@/app/capacity/actions";
import type { Consultant, EngagementWithJoins } from "@/lib/types";

const initialState: CapacityFormState = { error: null };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function CapacityForm({ consultants }: { consultants: Consultant[] }) {
  const [state, formAction, pending] = useActionState(setCapacityAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-3">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label htmlFor="cap_consultant_id" className="text-sm font-medium">Consultant</label>
          <select id="cap_consultant_id" name="consultant_id" required className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Select</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="weekly_hours" className="text-sm font-medium">Weekly hours</label>
          <input id="weekly_hours" name="weekly_hours" type="number" min="0" step="0.5" required defaultValue={40} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="cap_effective_from" className="text-sm font-medium">Effective from</label>
          <input id="cap_effective_from" name="effective_from" type="date" required defaultValue={todayISO()} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="cap_effective_to" className="text-sm font-medium">Effective to (optional)</label>
          <input id="cap_effective_to" name="effective_to" type="date" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50">
        {pending ? "Saving…" : "Set Capacity"}
      </button>
    </form>
  );
}

export function AllocationForm({
  consultants,
  engagements,
  defaultWeekStart,
}: {
  consultants: Consultant[];
  engagements: EngagementWithJoins[];
  defaultWeekStart: string;
}) {
  const [state, formAction, pending] = useActionState(setAllocationAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-3">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label htmlFor="alloc_consultant_id" className="text-sm font-medium">Consultant</label>
          <select id="alloc_consultant_id" name="consultant_id" required className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Select</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="engagement_id" className="text-sm font-medium">Engagement</label>
          <select id="engagement_id" name="engagement_id" required className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Select</option>
            {engagements.map((eng) => (
              <option key={eng.id} value={eng.id}>{eng.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="week_start_date" className="text-sm font-medium">Week starting (Mon)</label>
          <input id="week_start_date" name="week_start_date" type="date" required defaultValue={defaultWeekStart} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="planned_hours" className="text-sm font-medium">Planned hours</label>
          <input id="planned_hours" name="planned_hours" type="number" min="0" step="0.5" required className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50">
        {pending ? "Saving…" : "Set Allocation"}
      </button>
    </form>
  );
}
