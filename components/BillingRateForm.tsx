"use client";

import { useActionState } from "react";
import { createBillingRateAction, type BillingRateFormState } from "@/app/profitability/actions";
import type { Client, Consultant, EngagementWithJoins, Service } from "@/lib/types";

const initialState: BillingRateFormState = { error: null };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function BillingRateForm({
  consultants,
  clients,
  engagements,
  services,
}: {
  consultants: Consultant[];
  clients: Client[];
  engagements: EngagementWithJoins[];
  services: Service[];
}) {
  const [state, formAction, pending] = useActionState(createBillingRateAction, initialState);

  return (
    <form action={formAction} className="max-w-3xl space-y-3">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label htmlFor="consultant_id" className="text-sm font-medium">Consultant</label>
          <select id="consultant_id" name="consultant_id" required className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Select</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="rate_type" className="text-sm font-medium">Rate type</label>
          <select id="rate_type" name="rate_type" required className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="bill">Bill (client-facing)</option>
            <option value="cost">Cost (internal)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="amount_per_hour" className="text-sm font-medium">Amount / hour</label>
          <input id="amount_per_hour" name="amount_per_hour" type="number" min="0" step="0.01" required className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="currency" className="text-sm font-medium">Currency</label>
          <select id="currency" name="currency" defaultValue="IDR" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="IDR">IDR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label htmlFor="effective_from" className="text-sm font-medium">Effective from</label>
          <input id="effective_from" name="effective_from" type="date" required defaultValue={todayISO()} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="client_id" className="text-sm font-medium">Client override (optional)</label>
          <select id="client_id" name="client_id" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Applies to all clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="engagement_id" className="text-sm font-medium">Engagement override (optional)</label>
          <select id="engagement_id" name="engagement_id" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Applies to all engagements</option>
            {engagements.map((eng) => (
              <option key={eng.id} value={eng.id}>{eng.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="service_id" className="text-sm font-medium">Service override (optional)</label>
          <select id="service_id" name="service_id" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Applies to all services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="effective_to" className="text-sm font-medium">Effective to (optional)</label>
          <input id="effective_to" name="effective_to" type="date" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set Rate"}
      </button>
    </form>
  );
}
