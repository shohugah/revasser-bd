import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent, getListing } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { Photo } from "@/components/ui/Photo";
import { Empty, Listing, ListingFallback } from "@/components/shop/Listing";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  const { categories, collections } = getContent();
  const slugs = [...categories.map((c) => c.slug), ...collections.map((c) => c.slug), "new-arrivals", "best-sellers"];
  return Array.from(new Set(slugs)).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = getListing(slug);
  if (!listing) return {};
  const meta = pageMeta(listing.name, `${listing.name} at Revasser. ${listing.description}`.trim(), `/shop/${slug}`, listing.image || undefined);
  // An empty edit stays usable but is kept out of search results.
  return listing.products.length ? meta : { ...meta, robots: { index: false, follow: true } };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = getListing(slug);
  if (!listing) notFound();
  const { headings: h } = getContent();
  const isFashion = listing.categories.includes("fashion-clothing");
  const action = isFashion
    ? { label: "How pre-order works", href: "/pre-order" }
    : { label: "Ask us", href: "/contact" };
  const emptyTitle = isFashion ? "Made to your wish list." : h.emptyTitle;
  const emptyText = isFashion
    ? "Our Pakistani fashion is ordered for you. Choose the brand and the piece, and we bring it to Bangladesh."
    : h.emptyText;

  return (
    <>
      <header className={`border-b border-ink/10 ${listing.image ? "grid grid-cols-[1fr_38%] bg-soft md:grid-cols-2" : ""}`}>
        <div className={`flex flex-col justify-center py-10 pl-5 pr-4 sm:pl-8 lg:pl-12 3xl:pl-16 ${listing.image ? "lg:py-20" : "lg:py-24"}`}>
          <nav aria-label="Breadcrumb" className="mb-4 text-xs uppercase tracking-[0.18em] text-muted">
            <Link href="/shop" className="inline-flex min-h-6 items-center hover:text-ink">Shop</Link>
          </nav>
          <h1 className="font-serif text-[clamp(2rem,5.2vw,5.5rem)] leading-[1.02] [overflow-wrap:anywhere]">{listing.name}</h1>
          {listing.description && <p className="mt-4 max-w-md text-sm text-muted sm:text-base">{listing.description}</p>}
        </div>
        {listing.image && (
          <div className="relative min-h-[14rem] md:min-h-[22rem] lg:min-h-[28rem]">
            <Photo src={listing.image} alt="" sizes="(min-width:768px) 50vw, 38vw" priority className="object-[50%_35%]" />
          </div>
        )}
      </header>
      <div className="shell pb-24 pt-6">
        {listing.products.length ? (
          <Suspense fallback={<ListingFallback products={listing.products} />}>
            <Listing
              products={listing.products}
              emptyAction={action}
              labels={{ featured: h.sortFeatured, newest: h.sortNew, low: h.sortLow, high: h.sortHigh, emptyTitle, emptyText }}
            />
          </Suspense>
        ) : (
          <Empty title={emptyTitle} text={emptyText} action={action} />
        )}
      </div>
    </>
  );
}
