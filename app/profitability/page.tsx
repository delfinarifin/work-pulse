import { getCurrentConsultant, listActiveConsultants } from "@/lib/data/consultants";
import { listBillingRates } from "@/lib/data/billing-rates";
import { listExchangeRates } from "@/lib/data/exchange-rates";
import { listTimesheetEntries } from "@/lib/data/timesheets";
import { listActiveClients } from "@/lib/data/clients";
import { listEngagements } from "@/lib/data/engagements";
import { listServices } from "@/lib/data/services";
import { computeProfitability } from "@/lib/logic/profitability";
import BillingRateForm from "@/components/BillingRateForm";
import ExchangeRateForm from "@/components/ExchangeRateForm";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default async function ProfitabilityPage() {
  const consultant = await getCurrentConsultant();
  if (!consultant) {
    return <p className="text-sm text-neutral-500">Sign in to view profitability.</p>;
  }
  if (consultant.role !== "manager" && consultant.role !== "admin") {
    return (
      <p className="text-sm text-neutral-500">
        Manager or admin access required to view profitability.
      </p>
    );
  }

  const [entries, rates, exchangeRates, consultants, clients, engagements, services] =
    await Promise.all([
      listTimesheetEntries(),
      listBillingRates(),
      listExchangeRates(),
      listActiveConsultants(),
      listActiveClients(),
      listEngagements(),
      listServices(),
    ]);

  const rows = computeProfitability(entries, rates, exchangeRates);
  const usesUsdRates = rates.some((r) => r.currency === "USD");
  const hasCurrentUsdRate = exchangeRates.some(
    (r) => r.effective_from <= new Date().toISOString().slice(0, 10) &&
      (!r.effective_to || r.effective_to >= new Date().toISOString().slice(0, 10)),
  );
  const engagementById = new Map(engagements.map((e) => [e.id, e]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profitability</h1>
        <p className="text-sm text-neutral-500">
          Billed value vs. cost, by engagement/client, using each consultant&apos;s resolved
          bill/cost rate at the time the work was logged. All figures reported in IDR.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Set a billing rate</h2>
        <p className="text-xs text-neutral-500">
          A rate applies to one consultant, optionally narrowed to a client/engagement/service —
          the most specific match wins. Rates can be set in IDR or USD; the report below always
          converts to IDR. Cost rates are never shown outside this page.
        </p>
        <BillingRateForm consultants={consultants} clients={clients} engagements={engagements} services={services} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">USD → IDR exchange rate</h2>
        <p className="text-xs text-neutral-500">
          Needed to convert any USD-denominated rate to the IDR totals below. Effective-dated —
          an entry converts using the rate that was in effect on that entry&apos;s date, not
          today&apos;s rate.
        </p>
        {usesUsdRates && !hasCurrentUsdRate && (
          <p className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2">
            You have USD billing rates but no exchange rate covers today — those entries will show
            as unrated until one is set.
          </p>
        )}
        <ExchangeRateForm />
        {exchangeRates.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 max-w-md">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">1 USD =</th>
                  <th className="px-3 py-2 font-medium">From</th>
                  <th className="px-3 py-2 font-medium">To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {exchangeRates.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-1.5 text-neutral-700">{idr.format(r.rate_to_idr)}</td>
                    <td className="px-3 py-1.5 text-neutral-600">{r.effective_from}</td>
                    <td className="px-3 py-1.5 text-neutral-600">{r.effective_to ?? "ongoing"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">By engagement / client ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-neutral-400">No timesheet entries yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Engagement / Client</th>
                  <th className="px-4 py-2 font-medium">Hours</th>
                  <th className="px-4 py-2 font-medium">Billed</th>
                  <th className="px-4 py-2 font-medium">Cost</th>
                  <th className="px-4 py-2 font-medium">Margin</th>
                  <th className="px-4 py-2 font-medium">Budget realization</th>
                  <th className="px-4 py-2 font-medium">Unrated minutes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => {
                  const engagement = row.engagementId ? engagementById.get(row.engagementId) : null;
                  const margin = row.billedAmount - row.costAmount;
                  const realization = engagement?.budget_amount
                    ? `${Math.round((row.billedAmount / engagement.budget_amount) * 100)}%`
                    : "—";
                  return (
                    <tr key={row.key}>
                      <td className="px-4 py-2.5 text-neutral-700">
                        {row.engagementName ?? row.clientName ?? "Unassigned"}
                        {row.engagementName && row.clientName && (
                          <span className="text-neutral-400"> · {row.clientName}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-neutral-600">
                        {Math.round((row.totalMinutes / 60) * 10) / 10}h
                      </td>
                      <td className="px-4 py-2.5 text-neutral-600">{idr.format(row.billedAmount)}</td>
                      <td className="px-4 py-2.5 text-neutral-600">{idr.format(row.costAmount)}</td>
                      <td className={`px-4 py-2.5 font-medium ${margin < 0 ? "text-red-600" : "text-green-700"}`}>
                        {idr.format(margin)}
                      </td>
                      <td className="px-4 py-2.5 text-neutral-600">{realization}</td>
                      <td className="px-4 py-2.5 text-neutral-400">
                        {row.unratedMinutes > 0 ? `${row.unratedMinutes}m` : "—"}
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
