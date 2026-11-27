import "server-only";
import { callOrderSheet, ordersReady } from "./orders";
import type { AdminOrder, StockAction } from "./order-edit";
import { localMobile } from "./customers";

const ADMIN_SECRET = process.env.ADMIN_SHEET_SECRET?.trim() ?? "";
const ready = () => ordersReady() && ADMIN_SECRET.length >= 32;
const NOT_SET_UP = "The admin connection to your sheet is not set up yet. Add the ADMIN_SHEET_SECRET setting in Vercel, then deploy again.";

function explain(error: string) {
  if (error === "unknown action") return "Your Google Apps Script is an older version. Paste the new Code.gs and deploy a new version.";
  if (error === "admin forbidden") return "The sheet refused the admin secret. Check that ADMIN_SHEET_SECRET in Vercel matches ADMIN_SECRET in Apps Script.";
  return "";
}

const tidy = (o: AdminOrder): AdminOrder => ({ ...o, mobile: localMobile(o.mobile) });

/** Call only after checking the admin session: the result holds customer details. */
export async function listOrders(): Promise<{ orders: AdminOrder[] } | { problem: string }> {
  if (!ready()) return { problem: NOT_SET_UP };
  try {
    const reply = await callOrderSheet<{ orders?: AdminOrder[] }>({ action: "admin_orders", admin: ADMIN_SECRET });
    if (reply.error && explain(reply.error)) return { problem: explain(reply.error) };
    if (reply.error || !Array.isArray(reply.orders)) throw new Error(reply.error || "unexpected reply");
    // Newest first, even if the sheet has been re-sorted.
    return { orders: reply.orders.map(tidy).reverse().sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)) };
  } catch (err) {
    console.error("Admin orders not read:", err);
    return { problem: "Could not read your Google Sheet just now. Reload the page in a minute." };
  }
}

export type OrderSave =
  | { ok: true; order: AdminOrder; moved: { id: string; from: number; to: number }[]; skipped: string[] }
  | { ok: false; status: number; error: string; order?: AdminOrder };

export async function saveOrder(orderNo: string, expected: object, changes: object, stock: StockAction, by: string): Promise<OrderSave> {
  if (!ready()) return { ok: false, status: 503, error: NOT_SET_UP };
  const reply = await callOrderSheet<{ ok?: boolean; order?: AdminOrder; moved?: { id: string; from: number; to: number }[]; skipped?: string[] }>({ action: "update_order", admin: ADMIN_SECRET, orderNo, expected, changes, stock, by });
  if (reply.ok && reply.order) return { ok: true, order: tidy(reply.order), moved: reply.moved ?? [], skipped: reply.skipped ?? [] };
  const error = reply.error ?? "";
  if (error === "conflict") return { ok: false, status: 409, error: "The sheet changed while you were editing, so nothing was saved. The newest values are now shown. Check them and save again.", order: reply.order && tidy(reply.order) };
  if (error === "not found") return { ok: false, status: 404, error: "This order is no longer in the sheet. Go back to Orders." };
  if (error === "duplicate") return { ok: false, status: 409, error: "Two rows in the sheet have this order number. Fix the sheet, then try again." };
  if (error === "missing column") return { ok: false, status: 409, error: "A column heading is missing or renamed in the Orders tab." };
  if (error === "stock not allowed") return { ok: false, status: 409, error: "The stock cannot be changed for this order in its current state. Reload the page." };
  return { ok: false, status: 502, error: explain(error) || "The sheet could not save the change. Please try again." };
}
