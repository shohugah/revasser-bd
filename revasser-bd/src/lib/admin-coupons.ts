import "server-only";
import { callOrderSheet, ordersReady } from "./orders";
import type { Coupon, CouponValues } from "./coupon-edit";

const ADMIN_SECRET = process.env.ADMIN_SHEET_SECRET?.trim() ?? "";
const ready = () => ordersReady() && ADMIN_SECRET.length >= 32;
const NOT_SET_UP = "The admin connection to your sheet is not set up yet. Add the ADMIN_SHEET_SECRET setting in Vercel, then deploy again.";

function explain(error: string) {
  if (error === "unknown action") return "Your Google Apps Script is an older version. Paste the new Code.gs and deploy a new version.";
  if (error === "admin forbidden") return "The sheet refused the admin secret. Check that ADMIN_SHEET_SECRET in Vercel matches ADMIN_SECRET in Apps Script.";
  return "";
}

/** Call only after checking the admin session. */
export async function listCoupons(): Promise<{ coupons: Coupon[] } | { problem: string }> {
  if (!ready()) return { problem: NOT_SET_UP };
  try {
    const reply = await callOrderSheet<{ coupons?: Coupon[] }>({ action: "admin_coupons", admin: ADMIN_SECRET });
    if (reply.error && explain(reply.error)) return { problem: explain(reply.error) };
    if (reply.error || !Array.isArray(reply.coupons)) throw new Error(reply.error || "unexpected reply");
    return { coupons: reply.coupons };
  } catch (err) {
    console.error("Admin coupons not read:", err);
    return { problem: "Could not read your Google Sheet just now. Reload the page in a minute." };
  }
}

export type CouponSave = { ok: true; coupon: Coupon } | { ok: false; status: number; error: string; coupon?: Coupon };

/** `expected` is null for a new code, otherwise what the admin saw before editing. */
export async function saveCoupon(code: string, expected: CouponValues | null, next: CouponValues, by: string): Promise<CouponSave> {
  if (!ready()) return { ok: false, status: 503, error: NOT_SET_UP };
  const reply = await callOrderSheet<{ ok?: boolean; coupon?: Coupon }>({ action: "save_coupon", admin: ADMIN_SECRET, code, expected, next, by });
  if (reply.ok && reply.coupon) return { ok: true, coupon: reply.coupon };
  const error = reply.error ?? "";
  if (error === "exists") return { ok: false, status: 409, error: "This code is already in your sheet. Find it in the list and edit it.", coupon: reply.coupon };
  if (error === "conflict") return { ok: false, status: 409, error: "The sheet changed while you were editing, so nothing was saved. The newest values are now shown. Check them and save again.", coupon: reply.coupon };
  if (error === "not found") return { ok: false, status: 404, error: "This code is no longer in the sheet. Reload the page." };
  if (error === "duplicate") return { ok: false, status: 409, error: "Two rows in the Coupons tab have this code. Fix the sheet, then try again." };
  if (error === "missing column") return { ok: false, status: 409, error: "A column heading is missing or renamed in the Coupons tab." };
  return { ok: false, status: 502, error: explain(error) || "The sheet could not save the change. Please try again." };
}
