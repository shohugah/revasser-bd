// Shared by the Products screen and the save route.

export interface SheetProduct {
  id: string;
  name: string;
  regular: number | null;
  promo: number | null;
  stock: number | null;
  availability: string;
  show: boolean;
  category?: string;
  image?: string;
}

export const FIELDS = ["name", "regular", "promo", "stock", "availability", "show"] as const;
export type Field = (typeof FIELDS)[number];
export const AVAILABILITY = ["In stock", "Pre-order", "Sold out", "Confirm by phone"];

/** A plain explanation of what is wrong with the changed values, or "" when they are fine. */
export function problemWith(next: SheetProduct, changed: Field[]) {
  const whole = (v: unknown, min: number, max: number) => v === null || (Number.isInteger(v) && (v as number) >= min && (v as number) <= max);
  const has = (f: Field) => changed.includes(f);
  if (has("name") && (typeof next.name !== "string" || !next.name.trim() || next.name.length > 120 || /[\u0000-\u001f]/.test(next.name))) return "Enter a name of up to 120 characters.";
  if (has("regular") && !whole(next.regular, 1, 10_000_000)) return "Price must be a whole number of taka, or empty.";
  if (has("promo") && !whole(next.promo, 1, 10_000_000)) return "Sale price must be a whole number of taka, or empty.";
  if ((has("regular") || has("promo")) && next.promo !== null && (next.regular === null || next.promo >= next.regular)) return "Sale price must be lower than the price. Leave it empty for no sale.";
  if (has("stock") && !whole(next.stock, 0, 100_000)) return "Stock must be a whole number, 0 or more, or empty.";
  if (has("availability") && next.availability !== "" && !AVAILABILITY.includes(next.availability)) return "Choose an availability from the list.";
  if (has("show") && typeof next.show !== "boolean") return "Choose whether the product shows on the website.";
  return "";
}

/** What the shop will show for these values (same rules as the website). */
export function shopState(p: SheetProduct) {
  if (!p.show) return "Hidden";
  if (p.regular === null || p.stock === null || p.stock <= 0 || p.availability === "Sold out") return "Stock Out";
  return p.stock < 5 ? "Low Stock" : "On sale in shop";
}
