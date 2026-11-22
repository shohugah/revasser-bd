"use client";

import { useStore } from "../StoreProvider";
import { Empty, Grid } from "./Listing";

export function WishlistView() {
  const { ready, wishlist } = useStore();
  if (!ready) return <p role="status" className="py-20 text-muted">Loading…</p>;
  return wishlist.length ? (
    <Grid products={wishlist} />
  ) : (
    <Empty title="Nothing saved yet." text="Tap the heart on any piece to keep it here, on this device." action={{ label: "Find something to love", href: "/shop" }} />
  );
}
