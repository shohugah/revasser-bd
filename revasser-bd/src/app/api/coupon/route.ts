import { NextRequest, NextResponse } from "next/server";
import { getStoreData } from "@/lib/content";
import { priceBag } from "@/lib/bag";
import { checkCoupon } from "@/lib/coupon";
import { ordersReady } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!ordersReady()) return NextResponse.json({ error: "Coupons are not available yet." }, { status: 503 });
  try {
    const body = await req.json();
    const bag = priceBag(body?.items, (await getStoreData()).products);
    if ("error" in bag) return NextResponse.json({ error: bag.error }, { status: 400 });
    const result = await checkCoupon(body?.code, bag.subtotal);
    return NextResponse.json(result, { status: "error" in result ? 400 : 200 });
  } catch (err) {
    console.error("Coupon check failed:", err);
    return NextResponse.json({ error: "We could not check that code just now." }, { status: 502 });
  }
}
