export const taka = (n: number) => `৳${n.toLocaleString("en-US")}`;
export const discount = (price: number, compareAt: number) => Math.round(((compareAt - price) / compareAt) * 100);
export const productHref = (id: string) => `/products/${encodeURIComponent(id)}`;

/** Fewer than this many left shows the "Low Stock" badge. */
export const LOW_STOCK = 5;
export const isLowStock = (p: { stock?: number | null; availability: string }) =>
  p.availability !== "Sold out" && typeof p.stock === "number" && p.stock > 0 && p.stock < LOW_STOCK;
