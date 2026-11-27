// Turns the sheet's rows into the numbers shown in the admin. No server or browser code here.

export interface Order {
  orderNo: string;
  date: string;
  status: string;
  items: string;
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  coupon: string;
  district: string;
  payment: string;
}
export interface Stock {
  id: string;
  name: string;
  regular: number | null;
  promo: number | null;
  stock: number | null;
  show: boolean;
}
export interface Report {
  orders: Order[];
  products: Stock[];
}

export const STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled", "Returned"];
/** The sheet says "New"; the admin calls the same thing "Pending". */
export function statusName(raw: string) {
  const s = raw.trim().toLowerCase();
  if (!s || s === "new") return "Pending";
  return STATUSES.find((x) => x.toLowerCase() === s) ?? raw.trim();
}
/** Cancelled and returned orders are not sales. */
export const isSale = (o: Order) => !["Cancelled", "Returned"].includes(statusName(o.status));

const DAY = 86_400_000;
/** Calendar day in Bangladesh, as 2026-11-27. */
export const dhakaDay = (time: number) => new Date(time + 6 * 3_600_000).toISOString().slice(0, 10);
export const orderDay = (o: Order) => (Number.isNaN(Date.parse(o.date)) ? "" : dhakaDay(Date.parse(o.date)));

/** The last `days` calendar days, oldest first, ending `back` days ago. */
export function lastDays(days: number, now: number, back = 0) {
  return Array.from({ length: days }, (_, i) => dhakaDay(now - (days - 1 - i + back) * DAY));
}
export const between = (orders: Order[], days: string[]) => {
  const set = new Set(days);
  return orders.filter((o) => set.has(orderDay(o)));
};

export function totals(orders: Order[]) {
  const sales = orders.filter(isSale);
  const sum = (pick: (o: Order) => number) => sales.reduce((n, o) => n + pick(o), 0);
  const amount = sum((o) => o.total);
  return {
    sales: amount,
    orders: sales.length,
    average: sales.length ? Math.round(amount / sales.length) : 0,
    delivery: sum((o) => o.delivery),
    discount: sum((o) => o.discount),
    lost: orders.length - sales.length,
  };
}

/** Rows for a bar list, largest first. */
export function countBy(orders: Order[], key: (o: Order) => string) {
  const map = new Map<string, number>();
  for (const o of orders) {
    const k = key(o);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function statusCounts(orders: Order[]) {
  const found = countBy(orders, (o) => statusName(o.status));
  const known = STATUSES.map((label) => ({ label, value: found.find((f) => f.label === label)?.value ?? 0 }));
  return [...known, ...found.filter((f) => !STATUSES.includes(f.label))];
}

/** Reads lines like "2 × Band (Gold / 7) @ Tk 1300". Colours and sizes are counted together. */
export function bestSellers(orders: Order[], limit = 8) {
  const map = new Map<string, { label: string; value: number; money: number }>();
  for (const o of orders.filter(isSale)) {
    for (const line of o.items.split("\n")) {
      const m = line.replace(/^'/, "").trim().match(/^(\d+)\s*×\s*(.+?)\s*@\s*Tk\s*([\d.]+)$/);
      if (!m) continue;
      const label = m[2].replace(/\s*\([^()]*\)$/, "");
      const row = map.get(label) ?? { label, value: 0, money: 0 };
      row.value += Number(m[1]);
      row.money += Number(m[1]) * Number(m[3]);
      map.set(label, row);
    }
  }
  return [...map.values()].sort((a, b) => b.value - a.value || b.money - a.money).slice(0, limit);
}

/** Same rules as the shop: no price or no stock is Stock Out, under 5 is Low Stock. */
export function stockAlerts(products: Stock[]) {
  return products
    .filter((p) => p.show)
    .map((p) => {
      const price = p.regular ?? null;
      const state = price === null ? "No price" : p.stock === null || p.stock <= 0 ? "Stock Out" : p.stock < 5 ? "Low Stock" : "";
      return { id: p.id, name: p.name || p.id, stock: p.stock, state };
    })
    .filter((p) => p.state)
    .sort((a, b) => (a.stock ?? -Infinity) - (b.stock ?? -Infinity) || a.name.localeCompare(b.name));
}

/** Sales per day, or per month when the period is long. */
export function salesSeries(orders: Order[], range: number | "all", now: number) {
  const sales = orders.filter((o) => isSale(o) && orderDay(o));
  let keys: string[];
  if (range !== "all") keys = lastDays(range, now);
  else {
    const first = sales.map(orderDay).sort()[0] ?? dhakaDay(now);
    const length = Math.round((Date.parse(dhakaDay(now)) - Date.parse(first)) / DAY) + 1;
    keys = lastDays(Math.max(length, 7), now);
    if (length > 92) keys = [...new Set(keys.map((k) => k.slice(0, 7)))];
  }
  const size = keys[0]?.length ?? 10;
  const map = new Map(keys.map((k) => [k, { key: k, sales: 0, orders: 0 }]));
  for (const o of sales) {
    const row = map.get(orderDay(o).slice(0, size));
    if (row) {
      row.sales += o.total;
      row.orders += 1;
    }
  }
  return [...map.values()];
}

export const taka = (n: number) => `Tk ${Math.round(n).toLocaleString("en-US")}`;
export function dayLabel(key: string) {
  const month = key.length === 7;
  return new Date(`${key}${month ? "-01" : ""}T00:00:00Z`).toLocaleDateString("en-GB", month ? { month: "short", year: "numeric", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" });
}
