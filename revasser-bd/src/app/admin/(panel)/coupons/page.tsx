import { requireAdmin } from "@/lib/admin";
import { listCoupons } from "@/lib/admin-coupons";
import { listOrders } from "@/lib/admin-orders";
import { isSale } from "@/lib/stats";
import { Problem } from "@/components/admin/Widgets";
import { CouponList } from "@/components/admin/CouponList";

export default async function Coupons() {
  await requireAdmin();
  const [result, orders] = await Promise.all([listCoupons(), listOrders()]);
  const title = <h1 className="text-2xl [font-family:inherit]">Coupons</h1>;
  if ("problem" in result) return <>{title}<Problem text={result.problem} /></>;
  // How many orders used each code, without cancelled and returned ones. Unknown if orders cannot be read.
  let used: Record<string, number> | null = null;
  if ("orders" in orders) {
    used = {};
    for (const o of orders.orders.filter(isSale)) {
      const code = o.coupon.trim().toUpperCase();
      if (code) used[code] = (Object.hasOwn(used, code) ? used[code] : 0) + 1;
    }
  }
  return (
    <>
      {title}
      <CouponList start={result.coupons} used={used} />
    </>
  );
}
