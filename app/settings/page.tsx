import { getCurrentConsultant, listConsultants } from "@/lib/data/consultants";
import { updateConsultantRoleAction, toggleConsultantActiveAction } from "@/app/settings/actions";
import { getOrCreateClassificationSettings } from "@/lib/data/classification-settings";
import { listLearningRules } from "@/lib/data/learning-rules";
import { listServices } from "@/lib/data/services";
import { listTasks } from "@/lib/data/tasks";
import { listServiceMappings, listTaskMappings } from "@/lib/data/mappings";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const consultant = await getCurrentConsultant();
  if (!consultant) {
    return <p className="text-sm text-neutral-500">Sign in to view settings.</p>;
  }

  const [settings, learningRules, services, tasks, serviceMappings, taskMappings] =
    await Promise.all([
      getOrCreateClassificationSettings(consultant.id),
      listLearningRules(consultant.id),
      listServices(),
      listTasks(),
      listServiceMappings(),
      listTaskMappings(),
    ]);

  const serviceById = new Map(services.map((s) => [s.id, s.name]));
  const taskById = new Map(tasks.map((t) => [t.id, t.name]));
  const isAdmin = consultant.role === "admin";
  const team = isAdmin ? await listConsultants() : [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-500">
          Configure how Work Pulse detects and classifies your activity.
        </p>
      </div>

      {isAdmin && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-700">Team &amp; roles ({team.length})</h2>
          <p className="text-xs text-neutral-500">
            Admin only. Managers can see the whole team&apos;s activity and timesheets; admins can
            also edit firm-wide services/tasks/keyword mappings.
          </p>
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Job role</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {team.map((member) => (
                  <tr key={member.id} className={member.active ? "" : "opacity-50"}>
                    <td className="px-4 py-2.5 text-neutral-700">{member.name}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{member.email}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{member.job_role}</td>
                    <td className="px-4 py-2.5">
                      <form action={updateConsultantRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={member.id} />
                        <select
                          name="role"
                          defaultValue={member.role}
                          disabled={!member.active}
                          className="rounded border border-neutral-300 px-2 py-1 text-xs"
                        >
                          <option value="consultant">Consultant</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          disabled={!member.active}
                          className="rounded bg-neutral-900 px-2 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          member.active ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {member.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <form action={toggleConsultantActiveAction}>
                        <input type="hidden" name="id" value={member.id} />
                        <input type="hidden" name="active" value={(!member.active).toString()} />
                        <button
                          type="submit"
                          className={`rounded border px-2 py-1 text-xs font-medium ${
                            member.active
                              ? "border-red-300 text-red-600 hover:bg-red-50"
                              : "border-green-300 text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {member.active ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Detection thresholds</h2>
        <SettingsForm settings={settings} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">
          Your learned rules ({learningRules.length})
        </h2>
        <p className="text-xs text-neutral-500">
          Every time you correct a classification, Work Pulse remembers the pattern so it
          recognizes the same file/folder automatically next time.
        </p>
        {learningRules.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No corrections yet — they&apos;ll show up here as you use Change on the Activity Log.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Pattern</th>
                  <th className="px-4 py-2 font-medium">Client</th>
                  <th className="px-4 py-2 font-medium">Service</th>
                  <th className="px-4 py-2 font-medium">Task</th>
                  <th className="px-4 py-2 font-medium">Times applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {learningRules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-4 py-2.5 font-mono text-xs text-neutral-600">{rule.pattern}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{rule.client?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{rule.service?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{rule.task?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{rule.times_applied}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">
          Firm services &amp; tasks
        </h2>
        <p className="text-xs text-neutral-500">
          Shared across the firm — managed by an admin (not yet self-serve; contact your
          Work Pulse admin to add or change these).
        </p>
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
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Classification keywords</h2>
        <p className="text-xs text-neutral-500">
          Filename keywords that auto-suggest a service or task, checked in priority order.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Keyword</th>
                  <th className="px-3 py-2 font-medium">Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {serviceMappings.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-1.5 font-mono text-xs text-neutral-600">{m.pattern}</td>
                    <td className="px-3 py-1.5 text-neutral-600">{serviceById.get(m.service_id) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Keyword</th>
                  <th className="px-3 py-2 font-medium">Task</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {taskMappings.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-1.5 font-mono text-xs text-neutral-600">{m.pattern}</td>
                    <td className="px-3 py-1.5 text-neutral-600">{taskById.get(m.task_id) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
