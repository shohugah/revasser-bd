import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getReport } from "@/lib/report";
import { between, dayLabel, lastDays, orderDay, salesSeries, statusCounts, statusName, stockAlerts, taka, totals } from "@/lib/stats";
import { BarList, Box, Empty, Problem, SalesChart, Stat } from "@/components/admin/Widgets";

export default async function Dashboard() {
  await requireAdmin();
  const result = await getReport();
  const title = <h1 className="text-2xl [font-family:inherit]">Dashboard</h1>;
  if ("problem" in result) return <>{title}<Problem text={result.problem} /></>;

  const { orders, products } = result.report;
  const now = Date.now();
  const today = totals(between(orders, lastDays(1, now)));
  const week = totals(between(orders, lastDays(7, now)));
  const month = totals(between(orders, lastDays(30, now)));
  const before = totals(between(orders, lastDays(30, now, 30)));
  const pending = orders.filter((o) => statusName(o.status) === "Pending").length;
  const alerts = stockAlerts(products);
  // Newest first by date, even if the sheet has been re-sorted.
  const recent = [...orders].reverse().sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)).slice(0, 8);
  const count = (n: number) => `${n} order${n === 1 ? "" : "s"}`;

  return (
    <>
      {title}
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Sales today" value={taka(today.sales)} note={count(today.orders)} />
        <Stat label="Last 7 days" value={taka(week.sales)} note={count(week.orders)} />
        <Stat label="Last 30 days" value={taka(month.sales)} note={before.sales ? `${count(month.orders)} · the 30 days before: ${taka(before.sales)}` : count(month.orders)} />
        <Stat label="Waiting to confirm" value={String(pending)} note="Pending orders" />
      </div>
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-3">
        <Box title="Sales, last 30 days" className="xl:col-span-2" note="Sales are order totals including delivery. Cancelled and returned orders are left out.">
          <SalesChart series={salesSeries(orders, 30, now)} />
          <p className="mt-3 text-sm"><Link href="/admin/analytics" className="text-[#2271b1] underline">More in Analytics</Link></p>
        </Box>
        <Box title="Orders by status" note="All orders in your sheet.">
          <BarList rows={statusCounts(orders)} unit="order" empty="No orders yet." />
        </Box>
        <Box title="Recent orders" className="xl:col-span-2">
          {recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead>
                  <tr className="border-b border-[#c3c4c7]">
                    {["Order", "Date", "Status", "Area"].map((h) => <th key={h} className={`py-2 pr-4 font-semibold ${h === "Area" ? "hidden sm:table-cell" : ""}`}>{h}</th>)}
                    <th className="py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.orderNo} className="border-b border-[#f0f0f1]">
                      <td className="whitespace-normal break-all py-2 pr-4 sm:break-normal"><Link href={`/admin/orders/${encodeURIComponent(o.orderNo)}`} prefetch={false} className="text-[#2271b1] underline">{o.orderNo}</Link></td>
                      <td className="py-2 pr-4">{orderDay(o) ? dayLabel(orderDay(o)) : "—"}</td>
                      <td className="py-2 pr-4">{statusName(o.status)}</td>
                      <td className="hidden py-2 pr-4 sm:table-cell">{o.district || "—"}</td>
                      <td className="py-2 text-right tabular-nums">{taka(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="No orders yet." />
          )}
        </Box>
        <Box title={`Stock to check (${alerts.length})`} note="Pieces shown on the website. Change stock in the Products tab of your sheet.">
          {alerts.length ? (
            <ul className="max-h-80 divide-y divide-[#f0f0f1] overflow-y-auto text-sm">
              {alerts.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0 break-words">{p.name}</span>
                  <span className={`shrink-0 ${p.state === "Low Stock" ? "text-[#8a5700]" : "text-[#b32d2e]"}`}>
                    {p.state}
                    {p.state === "Low Stock" ? ` · ${p.stock} left` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="Every piece on the website has 5 or more in stock." />
          )}
        </Box>
      </div>
    </>
  );
}
