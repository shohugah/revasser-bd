import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { callOrderSheet, ordersReady } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** The signed-in customer's own orders. The email comes from the verified session, never from the browser. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!ordersReady()) return NextResponse.json({ error: "Order history is not available yet." }, { status: 503 });
  try {
    const r = await callOrderSheet<{ orders?: unknown[] }>({ action: "history", email: user.email });
    if (!Array.isArray(r.orders)) throw new Error(r.error || "No order list");
    return NextResponse.json({ orders: r.orders }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("History failed:", err);
    return NextResponse.json({ error: "We could not load your orders just now." }, { status: 502 });
  }
}
