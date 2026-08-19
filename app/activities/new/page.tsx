import ActivityForm from "@/components/ActivityForm";
import { listClients } from "@/lib/data/clients";
import { listServices } from "@/lib/data/services";
import { listTasks } from "@/lib/data/tasks";
import { listEngagements } from "@/lib/data/engagements";

export default async function NewActivityPage() {
  const [clients, services, tasks, engagements] = await Promise.all([
    listClients(),
    listServices(),
    listTasks(),
    listEngagements(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log Activity</h1>
        <p className="text-sm text-neutral-500">
          Type the file you worked on — Work Pulse detects the client, service,
          and task automatically.
        </p>
      </div>
      <ActivityForm clients={clients} services={services} tasks={tasks} engagements={engagements} />
    </div>
  );
}
