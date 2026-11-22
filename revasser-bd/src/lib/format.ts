export const taka = (n: number) => `৳${n.toLocaleString("en-US")}`;
export const discount = (price: number, compareAt: number) => Math.round(((compareAt - price) / compareAt) * 100);
export const productHref = (id: string) => `/products/${encodeURIComponent(id)}`;
