import "server-only";
import { unstable_cache } from "next/cache";
import type { Availability, Product } from "./types";
import { callOrderSheet, ordersReady } from "./orders";

// The Products tab of the shop's Google Sheet controls price, sale price, stock and
// visibility. Everything else (photos, words, categories) still comes from Pages CMS.

export interface SheetRow {
  regular: number | null;
  promo: number | null;
  stock: number | null;
  availability: Availability | "";
  show: boolean;
}

/** How often the website looks at the sheet again. */
export const SHEET_SECONDS = 300;

const AVAILABILITY = ["In stock", "Pre-order", "Sold out", "Confirm by phone"];

function clean(value: unknown): Record<string, SheetRow> {
  const rows = (value as { products?: unknown })?.products;
  if (!rows || typeof rows !== "object") return {};
  const out: Record<string, SheetRow> = {};
  const money = (n: unknown) => (typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n) : null);
  for (const [id, raw] of Object.entries(rows as Record<string, Record<string, unknown>>)) {
    if (!raw || typeof raw !== "object") continue;
    out[id] = {
      regular: money(raw.regular),
      promo: money(raw.promo),
      stock: typeof raw.stock === "number" && Number.isFinite(raw.stock) ? Math.floor(raw.stock) : null,
      availability: (AVAILABILITY.includes(String(raw.availability)) ? raw.availability : "") as SheetRow["availability"],
      show: raw.show !== false,
    };
  }
  return out;
}

/** Sends the CMS product list (so new pieces get a row) and reads the sheet back. Throws on failure. */
const readSheet = unstable_cache(
  async (listing: string): Promise<Record<string, SheetRow>> => {
    const reply = await callOrderSheet<{ products?: unknown }>({ action: "catalog", products: JSON.parse(listing) });
    if (reply.error) throw new Error(`Products sheet answered: ${reply.error}`);
    return clean(reply);
  },
  ["products-sheet"],
  { revalidate: SHEET_SECONDS, tags: ["products-sheet"] },
);

/** Null when the sheet is not set up (the site then uses Pages CMS values). */
export async function sheetFor(products: Product[]): Promise<Record<string, SheetRow> | null> {
  if (!ordersReady()) return null;
  const listing = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.categoryName || p.category,
    options: [p.colours.map((c) => c.name).join(", "), p.sizes.join(", ")].filter(Boolean).join(" / "),
    price: p.compareAt ?? p.price,
    availability: p.availability,
    image: p.images[0]?.startsWith("/") ? `https://www.revasserbd.shop${p.images[0]}` : p.images[0] ?? "",
  }));
  return readSheet(JSON.stringify(listing)).catch((err) => {
    console.error("Products sheet not read:", err);
    // While building, use Pages CMS values so a Google hiccup never breaks a deploy.
    // On the live site, fail the background refresh instead: the last good page keeps showing.
    if (process.env.NEXT_PHASE === "phase-production-build") return null;
    throw err;
  });
}

/** Applies one sheet row to one product. Rows missing from the sheet leave the product as it is. */
export function applyRow(p: Product, row: SheetRow | undefined): Product | null {
  if (!row) return p;
  if (!row.show) return null;
  const next = { ...p, stock: row.stock };
  if (row.regular) {
    const onSale = row.promo !== null && row.promo < row.regular;
    next.price = onSale ? row.promo : row.regular;
    next.compareAt = onSale ? row.regular : null;
  }
  if (row.availability) next.availability = row.availability;
  // A counted stock of zero or less means sold out, unless the piece is taken on pre-order.
  if (row.stock !== null && row.stock <= 0 && next.availability !== "Pre-order") next.availability = "Sold out";
  return next;
}
