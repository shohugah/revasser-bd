import "server-only";
import { callOrderSheet, clean } from "./orders";
import { taka } from "./format";

/** Codes live in the sheet's Coupons tab; the sheet works out the discount. */
export async function checkCoupon(code: unknown, subtotal: number): Promise<{ code: string; discount: number } | { error: string }> {
  const wanted = clean(code, 30).toUpperCase();
  if (!/^[A-Z0-9_-]{2,30}$/.test(wanted)) return { error: "That code is not valid." };
  const r = await callOrderSheet<{ ok?: boolean; code?: string; discount?: number; minimum?: number }>({ action: "coupon", code: wanted, subtotal });
  if (r.error === "minimum") return { error: `This code needs an order of ${taka(Number(r.minimum) || 0)} or more.` };
  const discount = Math.floor(Number(r.discount) || 0);
  if (!r.ok || discount <= 0) return { error: "That code is not valid." };
  return { code: wanted, discount: Math.min(discount, subtotal) };
}
