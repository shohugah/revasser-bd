// Shared by the Orders screens and the save route.
import { statusName, STATUSES } from "./stats";

export interface AdminOrder {
  orderNo: string;
  date: string;
  status: string;
  name: string;
  mobile: string;
  email: string;
  district: string;
  area: string;
  address: string;
  items: string;
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  coupon: string;
  payment: string;
  note: string;
  message: string;
  lines: string;
  stockReturned: boolean;
}
export type StockAction = "" | "return" | "take";

/** The sheet's own word for a status shown in the admin. */
export const sheetStatus = (name: string) => (name === "Pending" ? "New" : name);
export const isClosed = (status: string) => ["Cancelled", "Returned"].includes(statusName(status));
export const hasStockRecord = (o: AdminOrder) => /:\d+/.test(o.lines);

/** What the admin may do with this order's stock once it has the chosen status. */
export function stockChoice(o: AdminOrder, status: string): StockAction {
  if (!hasStockRecord(o)) return "";
  if (isClosed(status)) return o.stockReturned ? "" : "return";
  return o.stockReturned ? "take" : "";
}

export const MAX_MESSAGE = 300;
export const validStatus = (s: unknown) => typeof s === "string" && STATUSES.map(sheetStatus).includes(s);
