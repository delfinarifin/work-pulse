"use client";

import { useActionState } from "react";
import { createExchangeRateAction, type BillingRateFormState } from "@/app/profitability/actions";

const initialState: BillingRateFormState = { error: null };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExchangeRateForm() {
  const [state, formAction, pending] = useActionState(createExchangeRateAction, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-3">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label htmlFor="rate_to_idr" className="text-sm font-medium">1 USD = ? IDR</label>
          <input
            id="rate_to_idr"
            name="rate_to_idr"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="16000"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="er_effective_from" className="text-sm font-medium">Effective from</label>
          <input
            id="er_effective_from"
            name="effective_from"
            type="date"
            required
            defaultValue={todayISO()}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="er_effective_to" className="text-sm font-medium">Effective to (optional)</label>
          <input
            id="er_effective_to"
            name="effective_to"
            type="date"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set Exchange Rate"}
      </button>
    </form>
  );
}
