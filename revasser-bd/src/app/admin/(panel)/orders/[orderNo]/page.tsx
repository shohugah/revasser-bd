import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { listOrders } from "@/lib/admin-orders";
import { Problem } from "@/components/admin/Widgets";
import { OrderDetail } from "@/components/admin/OrderDetail";

export default async function Order({ params }: { params: Promise<{ orderNo: string }> }) {
  await requireAdmin();
  const orderNo = decodeURIComponent((await params).orderNo);
  const result = await listOrders();
  const back = <p className="print:hidden"><Link href="/admin/orders" className="inline-block py-2 text-sm text-[#2271b1] underline">All orders</Link></p>;
  if ("problem" in result) return <>{back}<Problem text={result.problem} /></>;
  const order = result.orders.find((o) => o.orderNo === orderNo);
  if (!order) return <>{back}<Problem text="This order is not in the sheet." /></>;
  return (
    <>
      {back}
      <OrderDetail key={order.orderNo} start={order} />
    </>
  );
}
