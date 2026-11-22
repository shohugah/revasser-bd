import { NextRequest, NextResponse } from "next/server";
import { wcFetch } from "@/lib/woocommerce";
import { toWhatsAppNumber } from "@/lib/whatsapp";

const STATUS_MAP: Record<string, string> = {
  pending: "Pending",
  "on-hold": "Pending",
  processing: "Confirmed & Processing",
  completed: "Delivered",
  cancelled: "Cancelled",
  refunded: "Returned",
  failed: "Cancelled",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId")?.replace(/\D/g, "");
    const phone = searchParams.get("phone")?.trim();

    if (!orderId || !phone) {
      return NextResponse.json(
        { error: "Both Order ID and Phone Number are required." },
        { status: 400 }
      );
    }

    const order = await wcFetch<any>(`/orders/${orderId}`, { cache: "no-store" });

    // The whole number must match. A suffix match let anyone guess another customer's order.
    const given = toWhatsAppNumber(phone);
    if (!given || given !== toWhatsAppNumber(String(order.billing?.phone ?? ""))) {
      return NextResponse.json(
        { error: "Order not found or phone number does not match." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      status: STATUS_MAP[order.status] || order.status,
      dateCreated: order.date_created,
      total: order.total,
      paymentMethod: order.payment_method_title,
      district: order.billing?.city,
      items: order.line_items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        total: item.total,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
}
