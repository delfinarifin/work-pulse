import ActivityForm from "@/components/ActivityForm";
import { listConsultants } from "@/lib/data/consultants";

export default async function NewActivityPage() {
  const consultants = await listConsultants();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log Activity</h1>
        <p className="text-sm text-neutral-500">
          Simulate the tracker agent by logging a file-activity event.
        </p>
      </div>
      <ActivityForm consultants={consultants} />
    </div>
  );
}
