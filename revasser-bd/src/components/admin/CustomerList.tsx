"use client";

import { useState } from "react";
import Link from "next/link";
import { dayLabel, orderDay, taka } from "@/lib/stats";
import { Pending } from "./Pending";

export type CustomerRow = { id: string; name: string; names: string; mobile: string; district: string; orders: number; spent: number; last: string };

export function CustomerList({ rows }: { rows: CustomerRow[] }) {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(50);
  const words = search.trim().toLowerCase();
  const digits = words.replace(/\D/g, "").replace(/^(880|88)/, "");
  const shown = rows.filter((c) => !words || c.names.toLowerCase().includes(words) || (digits.length > 3 && c.mobile.replace(/\D/g, "").includes(digits)));
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[#50575e]">{rows.length} {rows.length === 1 ? "customer" : "customers"}</p>
        <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setLimit(50); }} placeholder="Name or mobile" aria-label="Search customers" className="min-h-10 w-full border border-[#8c8f94] bg-white px-3 text-base sm:w-72" />
      </div>
      <ul className="mt-3 divide-y divide-[#dcdcde] border border-[#c3c4c7] bg-white">
        {shown.slice(0, limit).map((c) => {
          const day = orderDay({ date: c.last });
          return (
            <li key={c.id}>
              <Link href={`/admin/customers/${encodeURIComponent(c.id)}`} prefetch={false} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 hover:bg-[#f6f7f7]">
                <span className="min-w-0 flex-1 basis-40 break-words font-semibold text-[#2271b1]">{c.name || "No name"}<Pending /></span>
                <span className="w-28 text-sm tabular-nums">{c.mobile || "—"}</span>
                <span className="w-28 break-words text-sm text-[#50575e]">{c.district || "—"}</span>
                <span className="w-20 text-sm">{c.orders} {c.orders === 1 ? "order" : "orders"}</span>
                <span className="w-24 text-sm text-[#50575e]">Last {day ? dayLabel(day) : "—"}</span>
                <span className="ml-auto w-24 text-right text-sm tabular-nums">{taka(c.spent)}</span>
              </Link>
            </li>
          );
        })}
        {!shown.length && <li className="p-4 text-sm text-[#646970]">{rows.length ? "No customers match." : "No customers yet. They appear after the first order."}</li>}
      </ul>
      {shown.length > limit && <button onClick={() => setLimit(limit + 50)} className="mt-3 min-h-11 border border-[#2271b1] bg-white px-4 text-sm text-[#2271b1]">Show more</button>}
      <p className="mt-3 text-sm text-[#646970]">The amount is the total of each customer&apos;s orders, without cancelled and returned ones.</p>
    </>
  );
}
