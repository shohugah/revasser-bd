import { NextRequest, NextResponse } from "next/server";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import { callOrderSheet, clean, ordersReady } from "@/lib/orders";

export const dynamic = "force-dynamic";

const STATUS_TEXT: Record<string, string> = {
  New: "Received. We will call you to confirm it.",
  Confirmed: "Confirmed and being prepared.",
  Shipped: "On its way to you.",
  Delivered: "Delivered.",
  Cancelled: "Cancelled.",
  Returned: "Returned.",
};

/** Sheets may hand back a date string in several shapes. Show a short Dhaka date when it can be read. */
function shortDate(value: unknown) {
  const text = String(value ?? "").trim();
  const date = new Date(text);
  if (!text || Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" });
}

const money = (value: unknown) => {
  const n = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n.toLocaleString("en-US") : String(value ?? "");
};

const NOT_FOUND = "We could not find an order with that number and mobile.";

// POST, not GET, so the mobile number never sits in a URL or a log.
export async function POST(req: NextRequest) {
  if (!ordersReady()) return NextResponse.json({ error: "Order tracking is being set up. Please try again soon." }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: NOT_FOUND }, { status: 400 });
  }
  const orderNo = clean(body.orderNo, 30).toUpperCase();
  const mobile = toWhatsAppNumber(clean(body.phone, 30));
  if (!/^R\d{6}-[A-Z0-9]{4,6}$/.test(orderNo) || !mobile) {
    return NextResponse.json({ error: "Enter the order number (like R251127-7KQ2M) and the mobile number you used." }, { status: 400 });
  }

  try {
    const order = await callOrderSheet<{ orderNo?: string; date?: string; status?: string; items?: string; total?: string; district?: string; message?: string }>({
      action: "track",
      orderNo,
      phone: `0${mobile.slice(3)}`,
    });
    // "forbidden" means the secret in Vercel does not match the sheet: a set-up fault, not a missing order.
    if (order.error === "forbidden") throw new Error("Order sheet refused the secret. Check ORDERS_SECRET in Vercel.");
    if (order.error || !order.orderNo) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    const status = String(order.status || "New");
    return NextResponse.json({
      orderNo: order.orderNo,
      date: shortDate(order.date),
      status,
      statusText: STATUS_TEXT[status] ?? status,
      items: order.items,
      total: money(order.total),
      district: order.district,
      message: order.message,
    });
  } catch (err) {
    console.error("Tracking failed:", err);
    return NextResponse.json({ error: "We could not check that just now. Please try again in a minute." }, { status: 502 });
  }
}
