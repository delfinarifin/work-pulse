import type { BillableStatus, BillingRate, RateType, TimesheetEntryWithJoins } from "@/lib/types";

// Most-specific-wins, same resolution pattern as billable_task_rules:
// among rates matching this entry's consultant/date, the one that also
// matches on engagement/client/service (in that specificity order) beats
// a more general one. A rate with client_id/engagement_id/service_id all
// null is a consultant-wide default; any of those set narrows the match.
export function resolveRate(
  rates: BillingRate[],
  scope: {
    consultantId: string;
    clientId: string | null;
    engagementId: string | null;
    serviceId: string | null;
    date: string;
  },
  rateType: RateType,
): BillingRate | null {
  const candidates = rates.filter((r) => {
    if (r.rate_type !== rateType) return false;
    if (r.consultant_id !== scope.consultantId) return false;
    if (r.effective_from > scope.date) return false;
    if (r.effective_to && r.effective_to < scope.date) return false;
    if (r.client_id && r.client_id !== scope.clientId) return false;
    if (r.engagement_id && r.engagement_id !== scope.engagementId) return false;
    if (r.service_id && r.service_id !== scope.serviceId) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const specificity = (r: BillingRate) =>
      (r.engagement_id ? 1 : 0) + (r.client_id ? 1 : 0) + (r.service_id ? 1 : 0);
    const bySpecificity = specificity(b) - specificity(a);
    if (bySpecificity !== 0) return bySpecificity;
    return b.effective_from.localeCompare(a.effective_from);
  });

  return candidates[0];
}

export type ProfitabilityRow = {
  key: string;
  engagementId: string | null;
  engagementName: string | null;
  clientId: string | null;
  clientName: string | null;
  totalMinutes: number;
  billableMinutes: number;
  billedAmount: number;
  costAmount: number;
  unratedMinutes: number; // minutes with no resolvable bill/cost rate
};

// Only billable-status entries generate billed revenue; every entry with a
// resolvable cost rate still counts toward cost (non-billable time still
// costs the firm money, it just doesn't bill the client).
const BILLABLE_STATUSES: BillableStatus[] = ["billable"];

export function computeProfitability(
  entries: TimesheetEntryWithJoins[],
  rates: BillingRate[],
): ProfitabilityRow[] {
  const rows = new Map<string, ProfitabilityRow>();

  for (const entry of entries) {
    const key = entry.engagement_id ?? (entry.client_id ? `client:${entry.client_id}` : "unassigned");
    let row = rows.get(key);
    if (!row) {
      row = {
        key,
        engagementId: entry.engagement_id,
        engagementName: entry.engagement?.name ?? null,
        clientId: entry.client_id,
        clientName: entry.client?.name ?? null,
        totalMinutes: 0,
        billableMinutes: 0,
        billedAmount: 0,
        costAmount: 0,
        unratedMinutes: 0,
      };
      rows.set(key, row);
    }

    row.totalMinutes += entry.duration_minutes;
    const hours = entry.duration_minutes / 60;

    const costRate = resolveRate(
      rates,
      {
        consultantId: entry.consultant_id,
        clientId: entry.client_id,
        engagementId: entry.engagement_id,
        serviceId: entry.service_id,
        date: entry.date,
      },
      "cost",
    );
    if (costRate) {
      row.costAmount += hours * costRate.amount_per_hour;
    } else {
      row.unratedMinutes += entry.duration_minutes;
    }

    if (BILLABLE_STATUSES.includes(entry.billable_status)) {
      row.billableMinutes += entry.duration_minutes;
      const billRate = resolveRate(
        rates,
        {
          consultantId: entry.consultant_id,
          clientId: entry.client_id,
          engagementId: entry.engagement_id,
          serviceId: entry.service_id,
          date: entry.date,
        },
        "bill",
      );
      if (billRate) {
        row.billedAmount += hours * billRate.amount_per_hour;
      }
    }
  }

  return Array.from(rows.values()).sort((a, b) => b.billedAmount - a.billedAmount);
}
