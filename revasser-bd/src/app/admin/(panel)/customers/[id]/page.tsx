import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { listOrders } from "@/lib/admin-orders";
import { customersFrom } from "@/lib/customers";
import { dayLabel, orderDay, taka } from "@/lib/stats";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import { Problem } from "@/components/admin/Widgets";
import { StatusBadge } from "@/components/admin/OrderList";
import { Pending } from "@/components/admin/Pending";

const box = "border border-[#c3c4c7] bg-white p-4";
const heading = "mb-2 text-base font-semibold [font-family:inherit]";
const button = "flex min-h-11 items-center gap-2 border border-[#2271b1] bg-white px-4 text-sm text-[#2271b1]";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = decodeURIComponent((await params).id);
  const result = await listOrders();
  const back = <p><Link href="/admin/customers" className="inline-block py-2 text-sm text-[#2271b1] underline">All customers</Link></p>;
  if ("problem" in result) return <>{back}<Problem text={result.problem} /></>;
  // Any of the customer's order numbers finds them.
  const customer = customersFrom(result.orders).find((c) => c.orders.some((o) => o.orderNo === id));
  if (!customer) return <>{back}<Problem text="This customer is not in the sheet." /></>;
  const mobile = toWhatsAppNumber(customer.mobile);
  const newest = customer.orders[0];
  const email = customer.orders.find((o) => o.email)?.email;
  const others = customer.names.filter((n) => n !== customer.name);
  return (
    <>
      {back}
      <h1 className="break-words text-2xl [font-family:inherit]">{customer.name || "No name"}</h1>
      <p className="mt-1 text-sm text-[#50575e]">{customer.orders.length} {customer.orders.length === 1 ? "order" : "orders"} · {taka(customer.spent)} without cancelled and returned</p>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <section className={`${box} lg:order-last`}>
          <h2 className={heading}>Contact</h2>
          <p className="break-words text-sm">{customer.mobile || "No mobile"}{email && <><br />{email}</>}</p>
          {others.length > 0 && <p className="mt-2 break-words text-sm text-[#50575e]">Also ordered as: {others.join(", ")}</p>}
          <h3 className="mb-1 mt-3 text-sm font-semibold [font-family:inherit]">Latest delivery address</h3>
          <p className="break-words text-sm">{[newest.address, newest.area, newest.district].filter(Boolean).join(", ") || "—"}</p>
          {mobile && (
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:+${mobile}`} className={button}><Phone className="h-4 w-4" />Call</a>
              <a href={`https://wa.me/${mobile}`} target="_blank" rel="noopener noreferrer" className={button}><MessageCircle className="h-4 w-4" />WhatsApp</a>
            </div>
          )}
        </section>
        <section className={box}>
          <h2 className={heading}>Orders</h2>
          <ul className="divide-y divide-[#dcdcde]">
            {customer.orders.map((o) => {
              const day = orderDay(o);
              return (
                <li key={o.orderNo}>
                  <Link href={`/admin/orders/${encodeURIComponent(o.orderNo)}`} prefetch={false} className="block py-3 hover:bg-[#f6f7f7]">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="break-all text-sm font-semibold text-[#2271b1]">{o.orderNo}<Pending /></span>
                      <span className="text-sm text-[#50575e]">{day ? dayLabel(day) : "—"}</span>
                      <StatusBadge status={o.status} />
                      <span className="ml-auto text-sm tabular-nums">{taka(o.total)}</span>
                    </span>
                    <span className="mt-1 block whitespace-pre-line break-words text-sm text-[#50575e]">{o.items}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
