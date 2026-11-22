import type { MetadataRoute } from "next";
import { getContent, getListing } from "@/lib/content";
import { absolute } from "@/lib/seo";
import { productHref } from "@/lib/format";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const { categories, collections, pages, products } = getContent();
  const listings = [...categories, ...collections].map((c) => c.slug).concat("new-arrivals", "best-sellers");
  const paths = [
    "/",
    "/shop",
    "/pre-order",
    "/about",
    "/contact",
    // Empty edits are marked noindex, so they stay out of the sitemap too.
    ...Array.from(new Set(listings)).filter((slug) => getListing(slug)?.products.length).map((slug) => `/shop/${slug}`),
    ...products.map((p) => productHref(p.id)),
    ...pages.map((p) => `/${p.slug}`),
  ];
  return paths.map((path) => ({ url: absolute(path), lastModified: new Date() }));
}
