import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getReport } from "@/lib/report";
import { bestSellers, between, countBy, isSale, lastDays, salesSeries, statusCounts, taka, totals } from "@/lib/stats";
import { BarList, Box, Problem, SalesChart, Stat } from "@/components/admin/Widgets";
import { Pending } from "@/components/admin/Pending";

const RANGES = [
  { id: "7", name: "7 days" },
  { id: "30", name: "30 days" },
  { id: "90", name: "90 days" },
  { id: "all", name: "All time" },
];

export default async function Analytics({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  await requireAdmin();
  const asked = (await searchParams).range;
  const id = RANGES.find((r) => r.id === asked)?.id ?? "30";
  const result = await getReport();
  const title = <h1 className="text-2xl [font-family:inherit]">Analytics</h1>;
  if ("problem" in result) return <>{title}<Problem text={result.problem} /></>;

  const now = Date.now();
  const range = id === "all" ? "all" : Number(id);
  const orders = range === "all" ? result.report.orders : between(result.report.orders, lastDays(range, now));
  const sum = totals(orders);
  const sales = orders.filter(isSale);

  return (
    <>
      {title}
      <nav aria-label="Period" className="mt-4 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <Link key={r.id} href={`/admin/analytics?range=${r.id}`} aria-current={r.id === id ? "page" : undefined} className={`flex min-h-10 items-center border px-4 text-sm ${r.id === id ? "border-[#2271b1] bg-[#2271b1] text-white" : "border-[#c3c4c7] bg-white text-[#2271b1]"}`}>
            {r.name}
            <Pending />
          </Link>
        ))}
      </nav>
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Sales" value={taka(sum.sales)} note="Including delivery" />
        <Stat label="Orders" value={String(sum.orders)} note={`${sum.lost} cancelled or returned, not counted`} />
        <Stat label="Average order" value={taka(sum.average)} />
        <Stat label="Delivery fees" value={taka(sum.delivery)} note={`Coupon discounts: ${taka(sum.discount)}`} />
      </div>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <Box title="Sales over time" className="lg:col-span-2" note="Cancelled and returned orders are left out. Dates are Bangladesh time.">
          <SalesChart series={salesSeries(result.report.orders, range, now)} />
        </Box>
        <Box title="Best sellers" note="Pieces sold; the amount is before delivery and coupons.">
          <BarList rows={bestSellers(orders).map((b) => ({ ...b, extra: taka(b.money) }))} unit="piece" empty="Nothing sold in this period yet." />
        </Box>
        <Box title="Orders by status">
          <BarList rows={statusCounts(orders)} unit="order" empty="No orders in this period." />
        </Box>
        <Box title="Delivery area">
          <BarList rows={countBy(sales, (o) => o.district)} unit="order" empty="No orders in this period." />
        </Box>
        <Box title="Payment method">
          <BarList rows={countBy(sales, (o) => o.payment)} unit="order" empty="No orders in this period." />
        </Box>
        <Box title="Coupons used">
          <BarList rows={countBy(sales, (o) => o.coupon.toUpperCase())} unit="order" empty="No coupon was used in this period." />
        </Box>
      </div>
    </>
  );
}
