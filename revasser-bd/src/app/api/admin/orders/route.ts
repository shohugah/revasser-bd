import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { currentAdmin, tooMany } from "@/lib/admin";
import { saveOrder } from "@/lib/admin-orders";
import { MAX_MESSAGE, validStatus, type StockAction } from "@/lib/order-edit";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number, extra: object = {}) => NextResponse.json({ error, ...extra }, { status });

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host")) return fail("Not allowed.", 403);
  const admin = await currentAdmin();
  if (!admin) return fail("Please sign in again.", 401);
  if (tooMany(`admin-order:${admin.email}`, 120)) return fail("Too many changes at once. Please wait a few minutes.", 429);

  let orderNo: string, expected: Record<string, unknown>, changes: Record<string, unknown>, stock: StockAction;
  try {
    ({ orderNo, expected, changes, stock = "" } = await req.json());
    if (typeof orderNo !== "string" || !orderNo.trim() || orderNo.length > 40 || !expected || !changes) throw new Error("shape");
  } catch {
    return fail("Please reload the page and try again.", 400);
  }
  const keys = Object.keys(changes);
  if (!["", "return", "take"].includes(stock) || (!keys.length && !stock) || !keys.every((k) => k === "status" || k === "message")) return fail("Nothing to save.", 400);
  if ("status" in changes && !validStatus(changes.status)) return fail("Choose a status from the list.", 400);
  if ("message" in changes && (typeof changes.message !== "string" || changes.message.length > MAX_MESSAGE)) return fail(`The message can be up to ${MAX_MESSAGE} characters.`, 400);

  try {
    const result = await saveOrder(orderNo, expected, changes, stock, admin.email);
    if (!result.ok) return fail(result.error, result.status, { order: result.order });
    if (result.moved.length) {
      // Show the new stock on the shop straight away.
      revalidateTag("products-sheet");
      revalidatePath("/", "layout");
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("Order not saved:", err);
    return fail("We could not confirm the change. Reload the page to see what the sheet holds.", 502);
  }
}
