import { NextRequest, NextResponse } from "next/server";
import { wcFetch } from "@/lib/woocommerce";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      phone,
      email,
      district,
      area,
      address,
      notes,
      paymentMethod,
      trxId,
      deliveryFee,
      items,
    } = body;

    if (!customerName || !phone || !district || !address || !items?.length) {
      return NextResponse.json(
        { error: "Please complete all required Bangladesh delivery fields." },
        { status: 400 }
      );
    }

    const paymentTitles: Record<string, string> = {
      cod: "Cash on Delivery (Bangladesh)",
      bkash: `bKash Personal/Merchant (TrxID: ${trxId || "Not provided"})`,
      nagad: `Nagad Personal/Merchant (TrxID: ${trxId || "Not provided"})`,
      bank: `Bank Transfer (Ref: ${trxId || "Not provided"})`,
    };

    const wooOrderPayload = {
      payment_method: paymentMethod,
      payment_method_title: paymentTitles[paymentMethod] || "Cash on Delivery",
      set_paid: false,
      customer_note: notes || "",
      billing: {
        first_name: customerName,
        phone,
        email: email || "guest@revasserbd.com",
        city: district,
        state: area || district,
        address_1: `${area ? area + ", " : ""}${address}`,
        country: "BD",
      },
      shipping: {
        first_name: customerName,
        city: district,
        state: area || district,
        address_1: `${area ? area + ", " : ""}${address}`,
        country: "BD",
      },
      line_items: items.map((item: { id: string; quantity: number }) => ({
        product_id: Number(item.id),
        quantity: item.quantity,
      })),
      shipping_lines: [
        {
          method_id: "flat_rate",
          method_title: district === "Dhaka" ? "Inside Dhaka Delivery" : "Outside Dhaka Delivery",
          total: String(deliveryFee),
        },
      ],
      meta_data: [
        { key: "_revasser_district", value: district },
        { key: "_revasser_area", value: area || "" },
        { key: "_revasser_trx_id", value: trxId || "" },
      ],
    };

    const createdOrder = await wcFetch<any>("/orders", {
      method: "POST",
      body: JSON.stringify(wooOrderPayload),
      cache: "no-store",
    });

    return NextResponse.json({
      success: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.number,
      status: createdOrder.status,
      total: createdOrder.total,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
