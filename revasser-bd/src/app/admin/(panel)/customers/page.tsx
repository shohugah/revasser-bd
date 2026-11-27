import { requireAdmin } from "@/lib/admin";
import { listOrders } from "@/lib/admin-orders";
import { customersFrom } from "@/lib/customers";
import { Problem } from "@/components/admin/Widgets";
import { CustomerList } from "@/components/admin/CustomerList";

export default async function Customers() {
  await requireAdmin();
  const result = await listOrders();
  const title = <h1 className="text-2xl [font-family:inherit]">Customers</h1>;
  if ("problem" in result) return <>{title}<Problem text={result.problem} /></>;
  // Emails and addresses stay on the server until a customer is opened.
  const rows = customersFrom(result.orders).map((c) => ({ id: c.id, name: c.name, names: c.names.join(", "), mobile: c.mobile, district: c.district, orders: c.orders.length, spent: c.spent, last: c.last }));
  return (
    <>
      {title}
      <CustomerList rows={rows} />
    </>
  );
}
