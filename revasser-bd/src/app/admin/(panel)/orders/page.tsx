import { requireAdmin } from "@/lib/admin";
import { listOrders } from "@/lib/admin-orders";
import { Problem } from "@/components/admin/Widgets";
import { OrderList } from "@/components/admin/OrderList";

export default async function Orders() {
  await requireAdmin();
  const result = await listOrders();
  const title = <h1 className="text-2xl [font-family:inherit]">Orders</h1>;
  if ("problem" in result) return <>{title}<Problem text={result.problem} /></>;
  // The list needs only these; addresses stay on the server until an order is opened.
  const rows = result.orders.map(({ orderNo, date, status, name, mobile, total }) => ({ orderNo, date, status, name, mobile, total }));
  return (
    <>
      {title}
      <OrderList rows={rows} />
    </>
  );
}
