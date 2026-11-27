// Shared by the Coupons screen and the save route.

export interface Coupon {
  code: string;
  type: string;
  value: number;
  minimum: number;
  active: boolean;
}
export type CouponValues = Omit<Coupon, "code">;

/** A new code starts with a letter, so the sheet can never read it as a number or formula. */
export const NEW_CODE = /^[A-Z][A-Z0-9_-]{1,29}$/;

const whole = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/** Switching a code off is always allowed, even if its other cells were typed wrongly in the sheet. */
export const onlySwitchesOff = (before: CouponValues | null, next: CouponValues) =>
  !!before && next.active === false && next.type === before.type && next.value === before.value && next.minimum === before.minimum;

/** What is wrong with these values, in words for the admin. Empty when they are fine. */
export function couponProblem(v: CouponValues) {
  if (v.type !== "percent" && v.type !== "taka") return "Choose percent or taka.";
  if (v.type === "percent" && !whole(v.value, 1, 100)) return "A percent discount is a whole number from 1 to 100.";
  if (v.type === "taka" && !whole(v.value, 1, 1_000_000)) return "A taka discount is a whole number from 1 to 1,000,000.";
  if (!whole(v.minimum, 0, 10_000_000)) return "The minimum order is a whole number. Use 0 for no minimum.";
  if (typeof v.active !== "boolean") return "Choose on or off.";
  return "";
}
