// Customers are worked out from the orders in the sheet. Nothing extra is stored.
import type { AdminOrder } from "./order-edit";
import { isSale } from "./stats";
import { toWhatsAppNumber } from "./whatsapp";

export interface Customer {
  /** The first order number, so the page address never holds a phone number. */
  id: string;
  name: string;
  mobile: string;
  district: string;
  names: string[];
  spent: number;
  last: string;
  orders: AdminOrder[];
}

/** 01XXXXXXXXX, also when the sheet has dropped the first 0. Anything else is left as typed. */
export function localMobile(raw: string) {
  const n = toWhatsAppNumber(raw);
  return n ? `0${n.slice(3)}` : raw;
}

/** One customer per mobile number. Takes orders newest first and keeps that order. */
export function customersFrom(orders: AdminOrder[]): Customer[] {
  const groups = new Map<string, AdminOrder[]>();
  for (const o of orders) {
    // An order with no usable number stands alone rather than being merged with others.
    const digits = localMobile(o.mobile).replace(/\D/g, "");
    const key = digits.length >= 6 ? digits : o.orderNo;
    const group = groups.get(key);
    if (group) group.push(o);
    else groups.set(key, [o]);
  }
  return [...groups.values()].map((list) => {
    const newest = list[0];
    return {
      id: list[list.length - 1].orderNo,
      name: newest.name,
      mobile: localMobile(newest.mobile),
      district: newest.district,
      names: [...new Set(list.map((o) => o.name).filter(Boolean))],
      spent: list.filter(isSale).reduce((n, o) => n + o.total, 0),
      last: newest.date,
      orders: list,
    };
  });
}
