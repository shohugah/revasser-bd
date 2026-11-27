import "server-only";
import type { Product } from "./types";
import { clean } from "./orders";

export interface Line { product: Product; option: string; quantity: number }

/** Checks the browser's bag against the live product list. Prices never come from the browser. */
export function priceBag(items: unknown, products: Product[]): { error: string } | { lines: Line[]; wanted: Map<string, number>; subtotal: number } {
  const raw = Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
  if (raw.length < 1 || raw.length > 30) return { error: "Your bag is empty." };
  const lines: Line[] = [];
  for (const item of raw) {
    const product = products.find((p) => p.id === item?.id);
    const quantity = Number(item?.quantity);
    const option = clean(item?.option, 120);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return { error: "A piece in your bag is no longer available." };
    if (product.availability === "Sold out" || product.price === null) return { error: `${product.name} is out of stock. Please remove it to continue.` };
    const [first = "", second = ""] = option ? option.split(" / ") : [];
    const colour = product.colours.length ? first : "";
    const size = product.sizes.length ? (product.colours.length ? second : first) : "";
    const valid =
      (!product.colours.length || product.colours.some((c) => c.name === colour)) &&
      (!product.sizes.length || product.sizes.includes(size)) &&
      option === [colour, size].filter(Boolean).join(" / ");
    if (!valid) return { error: `Please choose the colour or size for ${product.name} again.` };
    lines.push({ product, option, quantity });
  }
  // Never take more than the stock left.
  const wanted = new Map<string, number>();
  for (const l of lines) wanted.set(l.product.id, (wanted.get(l.product.id) ?? 0) + l.quantity);
  for (const l of lines) {
    const left = l.product.stock;
    if (typeof left === "number" && (wanted.get(l.product.id) ?? 0) > left) return { error: `Only ${left} ${l.product.name} left. Please lower the quantity.` };
  }
  return { lines, wanted, subtotal: lines.reduce((sum, l) => sum + (l.product.price ?? 0) * l.quantity, 0) };
}
