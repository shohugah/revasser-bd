"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "../StoreProvider";

interface Order { orderNo: string; date: string; status: string; items: string; total: string }

/** Orders saved in the shop's records under the signed-in Google email. */
export function OrderHistory() {
  const { user } = useStore();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setOrders(null);
    setError("");
    if (!user) return;
    let current = true;
    fetch("/api/history")
      .then(async (r) => ({ ok: r.ok, body: await r.json() }))
      .then(({ ok, body }) => current && (ok ? setOrders(body.orders) : setError(body.error)))
      .catch(() => current && setError("We could not load your orders just now."));
    return () => { current = false; };
  }, [user]);

  if (!user) return null;
  if (error) return <p role="alert" className="mt-6 text-sm text-red-800">{error}</p>;
  if (!orders) return <p role="status" className="mt-6 text-sm text-muted">Loading your orders…</p>;
  if (!orders.length) return <p className="mt-6">No orders yet for {user.email}.</p>;
  return (
    <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
      {orders.map((o) => (
        <li key={o.orderNo} className="py-5">
          <p className="flex flex-wrap justify-between gap-2">
            <span className="tracking-[0.1em]">{o.orderNo}</span>
            <span className="text-sm text-muted">{o.date}</span>
          </p>
          <p className="mt-2 whitespace-pre-line text-sm text-muted">{o.items.replace(/ @ Tk \d+/g, "")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 text-sm">
            <span className="font-medium">{o.status}</span>
            <span>Total ৳{o.total}</span>
            <Link href={`/track-order?ref=${encodeURIComponent(o.orderNo)}`} className="flex min-h-11 items-center underline underline-offset-4">Track</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
