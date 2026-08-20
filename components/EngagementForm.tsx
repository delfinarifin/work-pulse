"use client";

import { useActionState } from "react";
import { createEngagementAction, type EngagementFormState } from "@/app/engagements/actions";
import type { BillingType, Client, Consultant, EngagementStatus, Service } from "@/lib/types";

const initialState: EngagementFormState = { error: null };

const STATUS_OPTIONS: { value: EngagementStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const BILLING_OPTIONS: { value: BillingType; label: string }[] = [
  { value: "hourly", label: "Hourly" },
  { value: "fixed_fee", label: "Fixed fee" },
  { value: "retainer", label: "Retainer" },
];

export default function EngagementForm({
  clients,
  services,
  consultants,
}: {
  clients: Client[];
  services: Service[];
  consultants: Consultant[];
}) {
  const [state, formAction, pending] = useActionState(createEngagementAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">Engagement name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="FY2025 Annual Tax Filing"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="client_id" className="text-sm font-medium">Client</label>
          <select id="client_id" name="client_id" required className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Select a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label htmlFor="service_id" className="text-sm font-medium">Service</label>
          <select id="service_id" name="service_id" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Not set</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="engagement_partner_id" className="text-sm font-medium">Engagement partner</label>
          <select id="engagement_partner_id" name="engagement_partner_id" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Not set</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="manager_id" className="text-sm font-medium">Manager</label>
          <select id="manager_id" name="manager_id" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Not set</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label htmlFor="status" className="text-sm font-medium">Status</label>
          <select id="status" name="status" defaultValue="active" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="billing_type" className="text-sm font-medium">Billing type</label>
          <select id="billing_type" name="billing_type" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="">Not set</option>
            {BILLING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="budget_hours" className="text-sm font-medium">Budget hours</label>
          <input id="budget_hours" name="budget_hours" type="number" min="0" step="0.5" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="budget_amount" className="text-sm font-medium">Budget amount</label>
          <input id="budget_amount" name="budget_amount" type="number" min="0" step="0.01" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label htmlFor="start_date" className="text-sm font-medium">Start date</label>
          <input id="start_date" name="start_date" type="date" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="target_date" className="text-sm font-medium">Target date</label>
          <input id="target_date" name="target_date" type="date" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="end_date" className="text-sm font-medium">End date</label>
          <input id="end_date" name="end_date" type="date" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create Engagement"}
      </button>
    </form>
  );
}
