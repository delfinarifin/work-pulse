import ActivityForm from "@/components/ActivityForm";
import { listClients } from "@/lib/data/clients";

export default async function NewActivityPage() {
  const clients = await listClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log Activity</h1>
        <p className="text-sm text-neutral-500">
          Simulate the tracker agent by logging a file-activity event.
        </p>
      </div>
      <ActivityForm clients={clients} />
    </div>
  );
}
