"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { discount, productHref } from "@/lib/format";
import { useStore } from "../StoreProvider";
import { Photo } from "../ui/Photo";
import { Price } from "./Price";

export function ProductCard({ product: p, sizes = "(min-width:1024px) 25vw, 50vw", priority, heading = "h3" }: {
  product: Product; sizes?: string; priority?: boolean; heading?: "h2" | "h3";
}) {
  const { isWished, toggleWish, quickView } = useStore();
  const wished = isWished(p.id);
  const Title = heading;
  const flag =
    p.availability === "Sold out" ? "Sold out"
    : p.compareAt && p.price !== null ? `−${discount(p.price, p.compareAt)}%`
    : p.availability === "Pre-order" ? "Pre-order"
    : p.isNew ? "New in" : "";
  return (
    <article className="group relative">
      <div className="relative overflow-hidden bg-soft">
        <Link href={productHref(p.id)} className="relative block aspect-square focus-visible:-outline-offset-4" tabIndex={-1} aria-hidden="true">
          <Photo src={p.images[0]} alt="" sizes={sizes} priority={priority} className="transition duration-1000 ease-silk group-hover:scale-[1.035]" />
        </Link>
        {flag && <span className="pointer-events-none absolute left-0 top-0 bg-page px-3 py-1.5 text-[10px] uppercase tracking-[0.18em]">{flag}</span>}
        <button
          onClick={() => toggleWish(p)}
          aria-pressed={wished}
          aria-label={`Save ${p.name} to wishlist`}
          className="icon-btn absolute right-0 top-0 bg-page/90"
        >
          <Heart className={`h-[18px] w-[18px] ${wished ? "fill-campaign text-campaign" : ""}`} strokeWidth={1.25} />
        </button>
        <button
          onClick={() => quickView(p.id)}
          aria-label={`Quick view ${p.name}`}
          className="absolute inset-x-0 bottom-0 hidden h-12 translate-y-full bg-page/95 text-xs uppercase tracking-[0.18em] transition-transform duration-500 ease-silk focus-visible:translate-y-0 group-hover:translate-y-0 [@media(hover:hover)]:block"
        >
          Quick view
        </button>
      </div>
      <Title className="mt-4 font-sans text-sm leading-snug sm:text-base">
        <Link href={productHref(p.id)} className="hover:underline hover:underline-offset-4">{p.name}</Link>
      </Title>
      <Price product={p} className="mt-1 text-xs sm:text-sm" />
      {p.colours.length > 0 && <p className="text-xs text-muted">{p.colours.map((c) => c.name).join(", ")}</p>}
    </article>
  );
}
