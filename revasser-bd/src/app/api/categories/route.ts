import { NextResponse } from "next/server";
import { wcFetch } from "@/lib/woocommerce";

export async function GET() {
  try {
    const rawCategories = await wcFetch<any[]>(
      "/products/categories?per_page=50&hide_empty=false",
      { revalidate: 300 }
    );

    const categories = rawCategories
      .filter((c) => c.slug !== "uncategorized")
      .map((c) => ({
        id: String(c.id),
        name: c.name,
        slug: c.slug,
        count: c.count,
        image:
          c.image?.src ||
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80",
      }));

    return NextResponse.json({ categories });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load categories." }, { status: 500 });
  }
}
