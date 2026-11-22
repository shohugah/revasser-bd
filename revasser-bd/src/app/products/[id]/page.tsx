import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/content";
import { absolute, pageMeta } from "@/lib/seo";
import { productHref, taka } from "@/lib/format";
import { whatsAppChatUrl } from "@/lib/whatsapp";
import { JsonLd } from "@/components/ui/JsonLd";
import { ProductView } from "@/components/shop/ProductView";
import { ProductRow, RecentlyViewed } from "@/components/shop/ProductRows";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getContent().products.map((p) => ({ id: p.id }));
}

const find = (id: string) => {
  const wanted = decodeURIComponent(id);
  return getContent().products.find((p) => p.id === wanted);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = find((await params).id);
  return p ? pageMeta(p.name, p.description || `${p.name} at Revasser.`, productHref(p.id), p.images[0]) : {};
}

const SCHEMA_AVAILABILITY: Record<string, string> = { "In stock": "InStock", "Pre-order": "PreOrder", "Sold out": "OutOfStock" };

export default async function ProductPage({ params }: Props) {
  const p = find((await params).id);
  if (!p) notFound();
  const { products, checkout } = getContent();
  const related = [
    ...products.filter((x) => x.id !== p.id && x.category === p.category && x.order > p.order),
    ...products.filter((x) => x.id !== p.id && x.category === p.category && x.order <= p.order),
  ].slice(0, 4);
  const detail = "group border-b border-ink/15";
  const summary = "flex min-h-14 items-center justify-between text-xs uppercase tracking-[0.18em]";
  const plus = <span aria-hidden="true" className="text-lg transition-transform group-open:rotate-45">+</span>;

  const url = absolute(productHref(p.id));
  return (
    <div className="shell pb-24">
      <nav aria-label="Breadcrumb" className="py-4 text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-x-2">
          <li><Link href="/shop" className="inline-flex min-h-8 items-center hover:text-ink">Shop</Link></li>
          {p.categoryName && (
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <Link href={`/shop/${p.category}`} className="inline-flex min-h-8 items-center hover:text-ink">{p.categoryName}</Link>
            </li>
          )}
        </ol>
      </nav>

      <ProductView key={p.id} product={p}>
        <div className="mt-9 border-t border-ink/15">
          {p.details.length > 0 && (
            <details className={detail} open>
              <summary className={summary}>Details {plus}</summary>
              <ul className="space-y-1 pb-5 text-sm text-muted">{p.details.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </details>
          )}
          <details className={detail}>
            <summary className={summary}>Delivery {plus}</summary>
            <p className="pb-5 text-sm text-muted">
              {checkout.insideLabel} {taka(checkout.insideFee)}. {checkout.outsideLabel} {taka(checkout.outsideFee)}. We confirm timing on WhatsApp.{" "}
              <Link href="/delivery" className="underline underline-offset-4">Delivery information</Link>
            </p>
          </details>
          <details className={detail}>
            <summary className={summary}>Exchanges & returns {plus}</summary>
            <p className="pb-5 text-sm text-muted">
              Contact us before sending anything back. <Link href="/returns" className="underline underline-offset-4">Read the policy</Link>
            </p>
          </details>
          <details className={detail} open={p.reviews.length > 0}>
            <summary className={summary}>Reviews {p.reviews.length > 0 && `(${p.reviews.length})`} {plus}</summary>
            <div className="space-y-4 pb-5 text-sm text-muted">
              {p.reviews.map((r, i) => (
                <figure key={i}>
                  <blockquote className="text-ink">“{r.text}”</blockquote>
                  <figcaption className="mt-1">{r.name}{r.source && `, ${r.source}`}</figcaption>
                </figure>
              ))}
              {p.reviews.length === 0 && <p>No reviews yet. We only publish words from real customers.</p>}
              {checkout.whatsapp && (
                <a
                  href={whatsAppChatUrl(checkout.whatsapp, `Hello Revasser, here is my review of the ${p.name}: `)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-ink underline underline-offset-4"
                >
                  Send us your review
                </a>
              )}
            </div>
          </details>
        </div>
      </ProductView>

      <ProductRow title="You may also like" products={related} />
      <RecentlyViewed exclude={p.id} />

      {/* Search engines require an offer, review or rating for product markup, so it waits for a real price. */}
      <JsonLd
        data={[
          ...(p.price !== null
            ? [{
                "@context": "https://schema.org",
                "@type": "Product",
                name: p.name,
                description: p.description,
                image: p.images.map(absolute),
                url,
                category: p.categoryName,
                offers: {
                  "@type": "Offer",
                  price: p.price,
                  priceCurrency: "BDT",
                  url,
                  ...(SCHEMA_AVAILABILITY[p.availability] && { availability: `https://schema.org/${SCHEMA_AVAILABILITY[p.availability]}` }),
                },
              }]
            : []),
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Shop", item: absolute("/shop") },
              { "@type": "ListItem", position: 2, name: p.name, item: url },
            ],
          },
        ]}
      />
    </div>
  );
}
