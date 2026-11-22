import { NextRequest, NextResponse } from "next/server";
import { wcFetch, mapWooProduct } from "@/lib/woocommerce";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = searchParams.get("page") || "1";

    const query = new URLSearchParams({
      status: "publish",
      per_page: "40",
      page,
    });

    if (category) query.set("category", category);
    if (search) query.set("search", search);

    const rawProducts = await wcFetch<any[]>(`/products?${query.toString()}`, {
      revalidate: 60,
    });

    const products = rawProducts.map(mapWooProduct);
    return NextResponse.json({ products });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load products." }, { status: 500 });
  }
}
