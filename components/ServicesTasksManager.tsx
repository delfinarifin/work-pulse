import {
  createServiceAction,
  updateServiceAction,
  createTaskAction,
  updateTaskAction,
} from "@/app/settings/actions";
import type { Service, Task, WorkType } from "@/lib/types";

export default function ServicesTasksManager({
  services,
  tasks,
  workTypes,
  isAdmin,
}: {
  services: Service[];
  tasks: Task[];
  workTypes: WorkType[];
  isAdmin: boolean;
}) {
  if (!isAdmin) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-medium text-neutral-500 mb-2">Services</h3>
          <ul className="text-sm text-neutral-700 space-y-1">
            {services.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-medium text-neutral-500 mb-2">Tasks</h3>
          <ul className="text-sm text-neutral-700 space-y-1">
            {tasks.map((t) => (
              <li key={t.id}>{t.name}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-neutral-500">Services</h3>
        <ul className="space-y-1.5">
          {services.map((s) => (
            <li key={s.id}>
              <form action={updateServiceAction} className="flex items-center gap-1.5">
                <input type="hidden" name="id" value={s.id} />
                <input
                  type="text"
                  name="name"
                  defaultValue={s.name}
                  className="flex-1 rounded border border-neutral-300 px-2 py-1 text-xs"
                />
                <select
                  name="default_work_type_id"
                  defaultValue={s.default_work_type_id ?? ""}
                  className="rounded border border-neutral-300 px-1.5 py-1 text-xs"
                >
                  <option value="">No work type</option>
                  {workTypes.map((wt) => (
                    <option key={wt.id} value={wt.id}>
                      {wt.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded bg-neutral-900 px-2 py-1 text-xs font-medium text-white hover:bg-neutral-700"
                >
                  Save
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={createServiceAction} className="flex items-center gap-1.5 border-t border-neutral-200 pt-3">
          <input
            type="text"
            name="name"
            placeholder="New service name"
            required
            className="flex-1 rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <select name="default_work_type_id" className="rounded border border-neutral-300 px-1.5 py-1 text-xs">
            <option value="">No work type</option>
            {workTypes.map((wt) => (
              <option key={wt.id} value={wt.id}>
                {wt.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-50"
          >
            Add
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-medium text-neutral-500">Tasks</h3>
        <ul className="space-y-1.5">
          {tasks.map((t) => (
            <li key={t.id}>
              <form action={updateTaskAction} className="flex items-center gap-1.5">
                <input type="hidden" name="id" value={t.id} />
                <input
                  type="text"
                  name="name"
                  defaultValue={t.name}
                  className="flex-1 rounded border border-neutral-300 px-2 py-1 text-xs"
                />
                <button
                  type="submit"
                  className="rounded bg-neutral-900 px-2 py-1 text-xs font-medium text-white hover:bg-neutral-700"
                >
                  Save
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={createTaskAction} className="flex items-center gap-1.5 border-t border-neutral-200 pt-3">
          <input
            type="text"
            name="name"
            placeholder="New task name"
            required
            className="flex-1 rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <button
            type="submit"
            className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-50"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
