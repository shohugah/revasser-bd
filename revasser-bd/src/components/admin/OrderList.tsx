"use client";

import { useState } from "react";
import Link from "next/link";
import { dayLabel, orderDay, statusName, STATUSES, taka } from "@/lib/stats";
import { Pending } from "./Pending";

type Row = { orderNo: string; date: string; status: string; name: string; mobile: string; total: number };
const TONE: Record<string, string> = { Pending: "bg-[#fcf9e8] text-[#8a5700]", Confirmed: "bg-[#f0f6fc] text-[#1d5a8a]", Shipped: "bg-[#f0f6fc] text-[#1d5a8a]", Delivered: "bg-[#edfaef] text-[#007017]", Cancelled: "bg-[#fcf0f1] text-[#b32d2e]", Returned: "bg-[#fcf0f1] text-[#b32d2e]" };
export const StatusBadge = ({ status }: { status: string }) => <span className={`inline-block px-2 py-0.5 text-xs ${TONE[statusName(status)] ?? "bg-[#f0f0f1]"}`}>{statusName(status)}</span>;

export function OrderList({ rows }: { rows: Row[] }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(50);
  const words = search.trim().toLowerCase();
  const digits = words.replace(/\D/g, "").replace(/^(880|88)/, "");
  const shown = rows.filter(
    (o) => (filter === "All" || statusName(o.status) === filter) && (!words || `${o.orderNo} ${o.name}`.toLowerCase().includes(words) || (digits.length > 3 && o.mobile.replace(/\D/g, "").includes(digits))),
  );
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {["All", ...STATUSES].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setLimit(50); }} aria-pressed={filter === f} className={`min-h-10 border px-3 text-sm ${filter === f ? "border-[#2271b1] bg-[#2271b1] text-white" : "border-[#c3c4c7] bg-white text-[#2271b1]"}`}>
            {f} ({f === "All" ? rows.length : rows.filter((o) => statusName(o.status) === f).length})
          </button>
        ))}
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order number, name or mobile" aria-label="Search orders" className="min-h-10 w-full border border-[#8c8f94] bg-white px-3 text-base sm:ml-auto sm:w-72" />
      </div>
      <ul className="mt-3 divide-y divide-[#dcdcde] border border-[#c3c4c7] bg-white">
        {shown.slice(0, limit).map((o) => {
          const day = orderDay(o);
          return (
            <li key={o.orderNo}>
              <Link href={`/admin/orders/${encodeURIComponent(o.orderNo)}`} prefetch={false} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 hover:bg-[#f6f7f7]">
                <span className="w-40 break-all font-semibold text-[#2271b1]">{o.orderNo}<Pending /></span>
                <span className="w-16 text-sm text-[#50575e]">{day ? dayLabel(day) : "—"}</span>
                <span className="min-w-0 flex-1 basis-32 break-words text-sm">{o.name || "—"}</span>
                <StatusBadge status={o.status} />
                <span className="ml-auto w-24 text-right text-sm tabular-nums">{taka(o.total)}</span>
              </Link>
            </li>
          );
        })}
        {!shown.length && <li className="p-4 text-sm text-[#646970]">No orders match.</li>}
      </ul>
      {shown.length > limit && <button onClick={() => setLimit(limit + 50)} className="mt-3 min-h-11 border border-[#2271b1] bg-white px-4 text-sm text-[#2271b1]">Show more</button>}
    </>
  );
}
