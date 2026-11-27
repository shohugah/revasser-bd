import { NextRequest, NextResponse } from "next/server";
import { currentAdmin, tooMany } from "@/lib/admin";
import { saveCoupon } from "@/lib/admin-coupons";
import { couponProblem, NEW_CODE, onlySwitchesOff, type CouponValues } from "@/lib/coupon-edit";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number, extra: object = {}) => NextResponse.json({ error, ...extra }, { status });
const pick = (v: CouponValues): CouponValues => ({ type: v.type, value: v.value, minimum: v.minimum, active: v.active });

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host")) return fail("Not allowed.", 403);
  const admin = await currentAdmin();
  if (!admin) return fail("Please sign in again.", 401);
  if (tooMany(`admin-coupon:${admin.email}`, 60)) return fail("Too many changes at once. Please wait a few minutes.", 429);

  let code: string, expected: CouponValues | null, next: CouponValues;
  try {
    const body = await req.json();
    code = String(body.code ?? "").trim().toUpperCase();
    if (!code || code.length > 40 || !body.next || typeof body.next !== "object" || (body.expected !== null && typeof body.expected !== "object")) throw new Error("shape");
    next = pick(body.next);
    expected = body.expected ? pick(body.expected) : null;
  } catch {
    return fail("Please reload the page and try again.", 400);
  }
  if (!expected && !NEW_CODE.test(code)) return fail("A code is 2 to 30 letters or numbers, starting with a letter. No spaces.", 400);
  const problem = onlySwitchesOff(expected, next) ? "" : couponProblem(next);
  if (problem) return fail(problem, 400);

  try {
    const result = await saveCoupon(code, expected, next, admin.email);
    if (!result.ok) return fail(result.error, result.status, { coupon: result.coupon });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Coupon not saved:", err);
    return fail("We could not confirm the change. Reload the page to see what the sheet holds.", 502);
  }
}
