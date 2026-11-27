"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "../StoreProvider";
import { GoogleSignIn } from "./GoogleSignIn";
import { OrderHistory } from "./OrderHistory";

export function AccountView() {
  const { data, ready, orders, addresses, forget, wishlist, count, open, user } = useStore();
  const [confirming, setConfirming] = useState(false);
  if (!ready) return <p role="status" className="py-20 text-muted">Loading…</p>;
  return (
    <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr] lg:gap-24">
      <section>
        <h2 className="display-md">Order history</h2>
        {data.checkout.googleClientId && (
          <div className="mt-5">
            <GoogleSignIn hint="Sign in with the Gmail you order with to see your past purchases on any device." />
          </div>
        )}
        <OrderHistory />
        {!user && <p className="mt-6 text-sm text-muted">Orders placed from this browser. We call to confirm each one before it is sent.</p>}
        {user ? null : orders.length === 0 ? (
          <div className="mt-8 border-t border-ink/10 pt-8">
            <p>No orders placed from this device yet.</p>
            <Link href="/shop" className="btn-dark mt-6">Start with the edit</Link>
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
            {orders.map((o) => (
              <li key={o.reference} className="py-6">
                <p className="flex flex-wrap justify-between gap-2">
                  <span className="tracking-[0.1em]">{o.reference}</span>
                  <span className="text-sm text-muted">{new Date(o.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </p>
                <p className="mt-2 text-sm text-muted">{o.items.map((i) => `${i.quantity} × ${i.name}${i.option ? ` (${i.option})` : ""}`).join(", ")}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 text-sm">
                  <span>Total ৳{o.total.toLocaleString("en-US")}</span>
                  <Link href={`/track-order?ref=${encodeURIComponent(o.reference)}`} className="flex min-h-11 items-center underline underline-offset-4">Track this order</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <aside className="space-y-10">
        <section>
          <h2 className="text-2xl">Saved pieces</h2>
          <p className="mt-3 text-sm text-muted">{wishlist.length} in your wishlist, {count} in your bag.</p>
          <div className="mt-2 flex gap-6">
            <Link href="/wishlist" className="link-line"><span>Wishlist</span></Link>
            <button onClick={() => open("bag")} className="link-line"><span>Bag</span></button>
          </div>
        </section>
        <section>
          <h2 className="text-2xl">Delivery details</h2>
          {addresses.length ? (
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {addresses.map(({ tag, details: d }) => <li key={tag}><span className="text-ink">{tag}:</span> {[d.customerName, d.phone, d.address, d.area].filter(Boolean).join(", ")}</li>)}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Tick “Save this address” at checkout to keep it here.</p>
          )}
        </section>
        <section className="border-t border-ink/10 pt-6">
          <p className="text-sm text-muted">There is no password. Saved addresses and your wishlist stay in this browser; signing in with Google shows your orders on any device.</p>
          {confirming ? (
            <div className="mt-4 flex gap-2">
              <button className="btn-dark" onClick={() => { forget(); setConfirming(false); }}>Clear everything</button>
              <button className="btn-line" onClick={() => setConfirming(false)}>Keep</button>
            </div>
          ) : (
            <button className="mt-2 min-h-11 text-sm underline underline-offset-4" onClick={() => setConfirming(true)}>Clear this device</button>
          )}
        </section>
      </aside>
    </div>
  );
}
