import { NextRequest, NextResponse } from "next/server";
import { getStoreData } from "@/lib/content";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import { callOrderSheet, clean, newOrderNo, ordersReady } from "@/lib/orders";

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
  const district = clean(body.district, 40);
  const area = clean(body.area, 80);
  const address = clean(body.address, 240);
  const note = clean(body.notes, 400, true);

  if (!name || !mobile || !area || !address) return fail("Please complete your name, mobile number and delivery address.");
  if (!checkout.districts.includes(district)) return fail("Please choose your district.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Please check your email address.");
  if (!checkout.cod) return fail("Online ordering is paused. Please try again soon.", 503);

  const raw = Array.isArray(body.items) ? body.items : [];
  if (raw.length < 1 || raw.length > 30) return fail("Your bag is empty.");

  // Prices always come from the product list on the server, never from the browser.
  const lines = [];
  for (const item of raw as Record<string, unknown>[]) {
    const product = products.find((p) => p.id === item?.id);
    const quantity = Number(item?.quantity);
    const option = clean(item?.option, 120);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return fail("A piece in your bag is no longer available.");
    if (product.price === null) return fail(`${product.name} does not have a price yet. Please remove it to continue.`);
    if (product.availability === "Sold out") return fail(`${product.name} is sold out. Please remove it to continue.`);
    const [first = "", second = ""] = option ? option.split(" / ") : [];
    const colour = product.colours.length ? first : "";
    const size = product.sizes.length ? (product.colours.length ? second : first) : "";
    const valid =
      (!product.colours.length || product.colours.some((c) => c.name === colour)) &&
      (!product.sizes.length || product.sizes.includes(size)) &&
      option === [colour, size].filter(Boolean).join(" / ");
    if (!valid) return fail(`Please choose the colour or size for ${product.name} again.`);
    lines.push({ product, option, quantity });
  }

  // Where the owner counts stock in the Products sheet, never take more than is left.
  const wanted = new Map<string, number>();
  for (const l of lines) wanted.set(l.product.id, (wanted.get(l.product.id) ?? 0) + l.quantity);
  for (const l of lines) {
    const left = l.product.stock;
    if (typeof left === "number" && l.product.availability !== "Pre-order" && (wanted.get(l.product.id) ?? 0) > left) {
      return fail(left > 0 ? `Only ${left} ${l.product.name} left. Please lower the quantity.` : `${l.product.name} is sold out. Please remove it to continue.`);
    }
  }

  const subtotal = lines.reduce((sum, l) => sum + (l.product.price ?? 0) * l.quantity, 0);
  const delivery = district === checkout.insideDistrict ? checkout.insideFee : checkout.outsideFee;
  const total = subtotal + delivery;
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
        payment: "Cash on Delivery",
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

  return NextResponse.json({ orderNo, subtotal, delivery, total });
}
