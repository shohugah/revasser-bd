import type { MetadataRoute } from "next";
import { getLiveContent, getListing } from "@/lib/content";
import { absolute } from "@/lib/seo";
import { productHref } from "@/lib/format";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories, collections, pages, products } = await getLiveContent();
  const listings = [...categories, ...collections].map((c) => c.slug).concat("new-arrivals", "best-sellers");
  const paths = [
    "/",
    "/shop",
    "/pre-order",
    "/about",
    "/contact",
    // Empty edits are marked noindex, so they stay out of the sitemap too.
    ...(await Promise.all(Array.from(new Set(listings)).map(async (slug) => ((await getListing(slug))?.products.length ? `/shop/${slug}` : ""))).then((x) => x.filter(Boolean))),
    ...products.map((p) => productHref(p.id)),
    ...pages.map((p) => `/${p.slug}`),
  ];
  return paths.map((path) => ({ url: absolute(path), lastModified: new Date() }));
}
