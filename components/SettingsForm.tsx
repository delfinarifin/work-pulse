"use client";

import { useState } from "react";
import { updateSettingsAction } from "@/app/settings/actions";
import type { ClassificationSettings } from "@/lib/types";

export default function SettingsForm({ settings }: { settings: ClassificationSettings }) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (formData) => {
        await updateSettingsAction(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="max-w-md space-y-4"
    >
      <input type="hidden" name="id" value={settings.id} />

      <div className="space-y-1">
        <label htmlFor="idle_threshold_minutes" className="text-sm font-medium">
          Idle threshold (minutes)
        </label>
        <p className="text-xs text-neutral-500">
          How long with no activity before a session is considered idle.
        </p>
        <input
          id="idle_threshold_minutes"
          name="idle_threshold_minutes"
          type="number"
          min={1}
          defaultValue={settings.idle_threshold_minutes}
          className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confidence_auto_accept_threshold" className="text-sm font-medium">
          Auto-accept confidence
        </label>
        <p className="text-xs text-neutral-500">
          Classifications at or above this confidence apply automatically, no confirmation needed.
        </p>
        <input
          id="confidence_auto_accept_threshold"
          name="confidence_auto_accept_threshold"
          type="number"
          min={0}
          max={1}
          step={0.05}
          defaultValue={settings.confidence_auto_accept_threshold}
          className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confidence_confirm_threshold" className="text-sm font-medium">
          Minimum confidence to suggest
        </label>
        <p className="text-xs text-neutral-500">
          Below this confidence, Work Pulse won&apos;t guess at all — you pick manually.
        </p>
        <input
          id="confidence_confirm_threshold"
          name="confidence_confirm_threshold"
          type="number"
          min={0}
          max={1}
          step={0.05}
          defaultValue={settings.confidence_confirm_threshold}
          className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium"
        >
          Save
        </button>
        {saved && <span className="text-sm text-emerald-700">Saved.</span>}
      </div>
    </form>
  );
}
