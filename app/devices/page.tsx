import { getCurrentConsultant } from "@/lib/data/consultants";
import { listDevicesForConsultant } from "@/lib/data/devices";
import { createDeviceAction, revokeDeviceAction } from "@/app/devices/actions";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  active: "bg-green-50 text-green-700",
  revoked: "bg-neutral-100 text-neutral-500",
};

export default async function DevicesPage() {
  const consultant = await getCurrentConsultant();
  if (!consultant) {
    return <p className="text-sm text-neutral-500">Sign in to view devices.</p>;
  }

  const devices = await listDevicesForConsultant(consultant.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
        <p className="text-sm text-neutral-500">
          Pair the Work Pulse desktop agent for zero-input background capture — no more typing
          file names on Log Activity.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Pair a new device</h2>
        <form action={createDeviceAction} className="flex items-center gap-2 max-w-md">
          <input
            type="text"
            name="device_name"
            placeholder="e.g. Work Laptop"
            required
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium"
          >
            Generate pairing code
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Your devices ({devices.length})</h2>
        {devices.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No devices yet — generate a pairing code above, then install and open the agent on
            your machine and enter the code when prompted.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Pairing code</th>
                  <th className="px-4 py-2 font-medium">Last seen</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {devices.map((device) => {
                  const pairingStillValid =
                    device.status === "pending" &&
                    device.pairing_code &&
                    device.pairing_code_expires_at &&
                    new Date(device.pairing_code_expires_at) > new Date();
                  return (
                    <tr key={device.id}>
                      <td className="px-4 py-2.5 font-medium">{device.device_name}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[device.status]}`}
                        >
                          {device.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {pairingStillValid ? (
                          <span className="text-neutral-700">{device.pairing_code}</span>
                        ) : device.status === "pending" ? (
                          <span className="text-neutral-400">Expired — revoke and re-generate</span>
                        ) : device.api_key_prefix ? (
                          <span className="text-neutral-400">{device.api_key_prefix}…</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-neutral-600">
                        {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : "Never"}
                      </td>
                      <td className="px-4 py-2.5">
                        {device.status !== "revoked" && (
                          <form action={revokeDeviceAction}>
                            <input type="hidden" name="id" value={device.id} />
                            <button
                              type="submit"
                              className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Revoke
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
