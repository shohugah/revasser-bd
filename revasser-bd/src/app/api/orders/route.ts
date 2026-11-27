import { NextRequest, NextResponse } from "next/server";
import { getStoreData } from "@/lib/content";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import { callOrderSheet, clean, newOrderNo, ordersReady } from "@/lib/orders";
import { priceBag } from "@/lib/bag";
import { checkCoupon } from "@/lib/coupon";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  if (!ordersReady()) return fail("Online ordering is being set up. Please try again soon.", 503);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Please check your order and try again.");
  }
  // A hidden field people never see. Bots fill it in.
  if (clean(body.website, 200)) return fail("Please check your order and try again.");

  let store;
  try {
    store = await getStoreData();
  } catch {
    return fail("We could not reach the shop just now. Nothing was charged. Please try again in a minute.", 503);
  }
  const { products, checkout } = store;
  const name = clean(body.customerName, 80);
  const mobile = toWhatsAppNumber(clean(body.phone, 30));
  const email = clean(body.email, 120);
  const area = clean(body.area, 80);
  const address = clean(body.address, 240);
  const note = clean(body.notes, 400, true);
  const location = body.location === "inside" || body.location === "outside" ? body.location : "";

  if (!name || !mobile || !area || !address) return fail("Please complete your name, mobile number and delivery address.");
  if (!location) return fail("Please choose Inside Dhaka or Outside Dhaka delivery.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Please check your email address.");
  if (!checkout.cod) return fail("Online ordering is paused. Please try again soon.", 503);

  // Card has no payment gateway yet, so it is never accepted.
  const method = clean(body.payment, 10) || "cod";
  const wallet = method === "bkash" ? "bKash" : method === "nagad" ? "Nagad" : "";
  if (method !== "cod" && !(wallet && checkout[method as "bkash" | "nagad"] && checkout.payNumber)) return fail("Please choose a payment method.");
  const trxId = clean(body.trxId, 30).toUpperCase();
  if (wallet && !/^[A-Z0-9]{6,20}$/.test(trxId)) return fail(`Enter the ${wallet} Transaction ID from your payment message.`);

  const bag = priceBag(body.items, products);
  if ("error" in bag) return fail(bag.error);
  const { lines, wanted, subtotal } = bag;
  const delivery = location === "inside" ? checkout.insideFee : checkout.outsideFee;
  const district = location === "inside" ? checkout.insideLabel : checkout.outsideLabel;

  let discount = 0;
  let coupon = "";
  if (clean(body.coupon, 30)) {
    try {
      const result = await checkCoupon(body.coupon, subtotal);
      if ("error" in result) return fail(`${result.error} Remove the coupon to continue.`);
      ({ discount, code: coupon } = result);
    } catch {
      return fail("We could not check your coupon just now. Please try again.", 502);
    }
  }
  const total = subtotal + delivery - discount;
  const orderNo = newOrderNo();
  const phone = `0${mobile.slice(3)}`;

  try {
    const saved = await callOrderSheet<{ ok?: boolean }>({
      action: "create",
      order: {
        orderNo,
        name,
        phone,
        email,
        district,
        area,
        address,
        note,
        payment: wallet ? `${wallet} · TrxID ${trxId} (check before shipping)` : "Cash on Delivery",
        discount,
        coupon,
        // The verified Google email, set by the server only.
        account: (await currentUser())?.email ?? "",
        items: lines
          .map((l) => `${l.quantity} × ${l.product.name}${l.option ? ` (${l.option})` : ""} @ Tk ${l.product.price}`)
          .join("\n"),
        subtotal,
        delivery,
        total,
        // Lets the sheet lower In Stock for each piece.
        lines: Array.from(wanted, ([id, quantity]) => ({ id, quantity })),
      },
    });
    if (saved.error === "stock") {
      const left = Number((saved as { left?: unknown }).left) || 0;
      const name = String((saved as { name?: unknown }).name || "A piece");
      return fail(left > 0 ? `Only ${left} ${name} left. Please lower the quantity.` : `${name} has just sold out. Please remove it to continue.`, 409);
    }
    if (!saved.ok) throw new Error(saved.error || "Order sheet refused the order");
  } catch (err) {
    console.error("Order not saved:", err);
    return fail("We could not place your order just now. Nothing was charged. Please try again in a minute.", 502);
  }

  return NextResponse.json({ orderNo, subtotal, delivery, discount, total });
}
