import { NextRequest, NextResponse } from "next/server";
import { wcFetch } from "@/lib/woocommerce";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import checkout from "../../../../content/checkout.json";

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
      items,
    } = body;

    if (!customerName || !phone || !district || !address || !items?.length) {
      return NextResponse.json(
        { error: "Please complete all required Bangladesh delivery fields." },
        { status: 400 }
      );
    }

    const validItems =
      Array.isArray(items) &&
      items.length <= 50 &&
      items.every(
        (i) => Number.isSafeInteger(Number(i?.id)) && Number(i.id) > 0 && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 20
      );
    if (!validItems || !toWhatsAppNumber(String(phone)) || !checkout.districts.includes(district)) {
      return NextResponse.json({ error: "Please check the items, mobile number and district." }, { status: 400 });
    }
    // The fee comes from the store's settings, never from the browser.
    const inside = district === checkout.insideDistrict;
    const deliveryFee = inside ? checkout.insideFee : checkout.outsideFee;

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
        ...(email && { email }),
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
          method_title: inside ? `${checkout.insideLabel} Delivery` : `${checkout.outsideLabel} Delivery`,
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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create the order." }, { status: 500 });
  }
}
