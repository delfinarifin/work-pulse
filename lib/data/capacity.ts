import { createClient } from "@/lib/supabase/server";
import type { ConsultantCapacityWithJoins, ResourceAllocationWithJoins } from "@/lib/types";
import { writeAuditLog } from "@/lib/data/audit-logs";

const CAPACITY_SELECT = "*, consultant:consultants(id, name)";
const ALLOCATION_SELECT = "*, consultant:consultants(id, name), engagement:engagements(id, name)";

export async function listConsultantCapacities(): Promise<ConsultantCapacityWithJoins[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consultant_capacity")
    .select(CAPACITY_SELECT)
    .order("effective_from", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ConsultantCapacityWithJoins[];
}

export type NewConsultantCapacity = {
  consultant_id: string;
  weekly_hours: number;
  effective_from: string;
  effective_to: string | null;
};

export async function createConsultantCapacity(
  capacity: NewConsultantCapacity,
): Promise<ConsultantCapacityWithJoins> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("consultant_capacity")
    .insert({ ...capacity, user_id: user?.id ?? null })
    .select(CAPACITY_SELECT)
    .single();
  if (error) throw error;
  const created = data as unknown as ConsultantCapacityWithJoins;

  await writeAuditLog({
    action: "capacity.create",
    entity: "consultant_capacity",
    entity_id: created.id,
    details: { consultant_id: created.consultant_id, weekly_hours: created.weekly_hours },
  });

  return created;
}

export async function listResourceAllocations(): Promise<ResourceAllocationWithJoins[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_allocations")
    .select(ALLOCATION_SELECT)
    .order("week_start_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ResourceAllocationWithJoins[];
}

export type NewResourceAllocation = {
  consultant_id: string;
  engagement_id: string;
  week_start_date: string;
  planned_hours: number;
};

export async function createResourceAllocation(
  allocation: NewResourceAllocation,
): Promise<ResourceAllocationWithJoins> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("resource_allocations")
    .insert({ ...allocation, user_id: user?.id ?? null })
    .select(ALLOCATION_SELECT)
    .single();
  if (error) throw error;
  const created = data as unknown as ResourceAllocationWithJoins;

  await writeAuditLog({
    action: "allocation.create",
    entity: "resource_allocations",
    entity_id: created.id,
    details: {
      consultant_id: created.consultant_id,
      engagement_id: created.engagement_id,
      week_start_date: created.week_start_date,
      planned_hours: created.planned_hours,
    },
  });

  return created;
}
