import type { Metadata } from "next";

export const SITE = "https://www.revasserbd.shop";
export const OG_IMAGE = "/brand/og.jpg";
export const absolute = (path: string) => new URL(path, SITE).toString();

/** Page metadata. Setting openGraph on a page replaces the layout's, so each page states it in full. */
export function pageMeta(title: string, description: string, path: string, image: string = OG_IMAGE): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: "Revasser", locale: "en_BD", type: "website", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
