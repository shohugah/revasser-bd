import "server-only";
import { callOrderSheet, ordersReady } from "./orders";
import type { SheetProduct } from "./product-edit";

const ADMIN_SECRET = process.env.ADMIN_SHEET_SECRET?.trim() ?? "";
const ready = () => ordersReady() && ADMIN_SECRET.length >= 32;

function explain(error: string) {
  if (error === "unknown action") return "Your Google Apps Script is an older version. Paste the new Code.gs and deploy a new version.";
  if (error === "admin forbidden") return "The sheet refused the admin secret. Check that ADMIN_SHEET_SECRET in Vercel matches ADMIN_SECRET in Apps Script.";
  return "";
}
const NOT_SET_UP = "The admin connection to your sheet is not set up yet. Add the ADMIN_SHEET_SECRET setting in Vercel, then deploy again.";

/** Call only after checking the admin session. */
export async function listProducts(): Promise<{ products: SheetProduct[] } | { problem: string }> {
  if (!ready()) return { problem: NOT_SET_UP };
  try {
    const reply = await callOrderSheet<{ products?: SheetProduct[] }>({ action: "admin_products", admin: ADMIN_SECRET });
    if (reply.error && explain(reply.error)) return { problem: explain(reply.error) };
    if (reply.error || !Array.isArray(reply.products)) throw new Error(reply.error || "unexpected reply");
    return { products: reply.products };
  } catch (err) {
    console.error("Admin products not read:", err);
    return { problem: "Could not read your Google Sheet just now. Reload the page in a minute." };
  }
}

export type SaveResult =
  | { ok: true; product: SheetProduct }
  | { ok: false; status: number; error: string; product?: SheetProduct };

export async function saveProduct(id: string, expected: object, changes: object, by: string): Promise<SaveResult> {
  if (!ready()) return { ok: false, status: 503, error: NOT_SET_UP };
  const reply = await callOrderSheet<{ ok?: boolean; product?: SheetProduct; field?: string }>({ action: "update_product", admin: ADMIN_SECRET, id, expected, changes, by });
  if (reply.ok && reply.product) return { ok: true, product: reply.product };
  const error = reply.error ?? "";
  if (error === "conflict") return { ok: false, status: 409, error: "The sheet changed while you were editing, so nothing was saved. The newest values are now shown. Check them and save again.", product: reply.product };
  if (error === "not found") return { ok: false, status: 404, error: "This product is no longer in the sheet. Reload the page." };
  if (error === "duplicate") return { ok: false, status: 409, error: "Two rows in the sheet have this Product Id. Remove the extra row, then try again." };
  if (error === "missing column") return { ok: false, status: 409, error: "A column heading is missing or renamed in the Products tab." };
  if (error === "invalid") return { ok: false, status: 400, error: `The sheet did not accept the value for ${reply.field}.` };
  return { ok: false, status: 502, error: explain(error) || "The sheet could not save the change. Please try again." };
}
