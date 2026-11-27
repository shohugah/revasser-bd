import "server-only";
import { callOrderSheet, ordersReady } from "./orders";
import type { Report } from "./stats";

// Reading the whole order list needs a second secret that only the admin area uses.
const ADMIN_SECRET = process.env.ADMIN_SHEET_SECRET?.trim() ?? "";

/** Call only after requireAdmin(). Returns a plain explanation instead of throwing. */
export async function getReport(): Promise<{ report: Report } | { problem: string }> {
  if (!ordersReady() || ADMIN_SECRET.length < 32) return { problem: "Reports are not set up yet. Add the ADMIN_SHEET_SECRET setting in Vercel, then deploy again." };
  try {
    const reply = await callOrderSheet<Partial<Report>>({ action: "report", admin: ADMIN_SECRET });
    if (reply.error === "unknown action") return { problem: "Your Google Apps Script is an older version. Paste the new Code.gs and deploy a new version." };
    if (reply.error === "admin forbidden") return { problem: "The sheet refused the admin secret. Check that ADMIN_SHEET_SECRET in Vercel matches ADMIN_SECRET in Apps Script." };
    if (reply.error || !Array.isArray(reply.orders) || !Array.isArray(reply.products)) throw new Error(reply.error || "unexpected reply");
    return { report: { orders: reply.orders, products: reply.products } };
  } catch (err) {
    console.error("Admin report not read:", err);
    return { problem: "Could not read your Google Sheet just now. Reload the page in a minute." };
  }
}
