import { Suspense } from "react";
import Link from "next/link";
import { getLiveContent } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";
import { Listing, ListingFallback } from "@/components/shop/Listing";

export const metadata = pageMeta("Shop all", "Shop the Revasser edit: jewellery, fashion and accessories delivered across Bangladesh.", "/shop");

export default async function ShopPage() {
  const { products, headings: h, categories } = await getLiveContent();
  return (
    <div className="shell pb-24">
      <PageIntro title={h.shopTitle || "Shop all"} />
      <ul className="no-bar -mx-5 mb-6 flex gap-6 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
        {categories.map((c) => (
          <li key={c.id} className="shrink-0">
            <Link href={`/shop/${c.slug}`} className="flex min-h-11 items-center text-sm hover:underline hover:underline-offset-4">{c.name}</Link>
          </li>
        ))}
      </ul>
      <Suspense fallback={<ListingFallback products={products} />}>
        <Listing
          products={products}
          emptyAction={{ label: "Ask us", href: "/contact" }}
          labels={{ featured: h.sortFeatured, newest: h.sortNew, low: h.sortLow, high: h.sortHigh, emptyTitle: h.emptyTitle, emptyText: h.emptyText }}
        />
      </Suspense>
    </div>
  );
}
