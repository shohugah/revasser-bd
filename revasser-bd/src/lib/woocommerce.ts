const STORE_URL = process.env.WC_STORE_URL?.replace(/\/$/, "") || "";
const CONSUMER_KEY = process.env.WC_CONSUMER_KEY || "";
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || "";

function getAuthHeader() {
  const token = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  return `Basic ${token}`;
}

export async function wcFetch<T>(
  endpoint: string,
  options: RequestInit & { revalidate?: number } = {}
): Promise<T> {
  if (!STORE_URL || !CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error("Missing WooCommerce environment variables.");
  }

  const { revalidate, ...fetchOptions } = options;
  const res = await fetch(`${STORE_URL}/wp-json/wc/v3${endpoint}`, {
    ...fetchOptions,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
    ...(revalidate !== undefined ? { next: { revalidate } } : {}),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`WooCommerce API Error (${res.status}): ${errorBody}`);
  }

  return res.json();
}

export function mapWooProduct(wc: any) {
  const regularPrice = parseFloat(wc.regular_price || wc.price || "0");
  const salePrice = wc.sale_price ? parseFloat(wc.sale_price) : undefined;

  const colorAttr = wc.attributes?.find(
    (a: any) => a.name.toLowerCase() === "color" || a.name.toLowerCase() === "colour"
  );
  const sizeAttr = wc.attributes?.find((a: any) => a.name.toLowerCase() === "size");

  return {
    id: String(wc.id),
    name: wc.name,
    slug: wc.slug,
    sku: wc.sku || `REV-${wc.id}`,
    category: wc.categories?.[0]?.slug || "uncategorized",
    categoryName: wc.categories?.[0]?.name || "General",
    brand:
      wc.attributes?.find((a: any) => a.name.toLowerCase() === "brand")?.options?.[0] ||
      "REVASSER BD",
    description:
      wc.short_description?.replace(/<[^>]+>/g, "") ||
      wc.description?.replace(/<[^>]+>/g, "") ||
      "",
    images:
      wc.images?.length > 0
        ? wc.images.map((img: any) => img.src)
        : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80"],
    regularPrice,
    discountPrice: salePrice && salePrice < regularPrice ? salePrice : undefined,
    colors: colorAttr ? colorAttr.options.map((c: string) => ({ name: c, hex: "#18181B" })) : [],
    sizes: sizeAttr ? sizeAttr.options : [],
    stock: wc.stock_quantity ?? (wc.stock_status === "instock" ? 15 : 0),
    featured: Boolean(wc.featured),
    isNew: wc.tags?.some((t: any) => t.slug === "new-arrival") || false,
    isBestSeller: wc.total_sales > 5 || wc.tags?.some((t: any) => t.slug === "best-seller"),
  };
}
