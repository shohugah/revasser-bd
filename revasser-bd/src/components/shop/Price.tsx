"use client";

import type { Product } from "@/lib/types";
import { taka } from "@/lib/format";
import { useStore } from "../StoreProvider";

export function Price({ product, className = "" }: { product: Product; className?: string }) {
  const { labels } = useStore().data;
  if (product.price === null) return <p className={`text-muted ${className}`}>{labels.priceOnRequest}</p>;
  return (
    <p className={`flex flex-wrap items-baseline gap-x-3 ${className}`}>
      <span><span className="sr-only">Price </span>{taka(product.price)}</span>
      {product.compareAt && (
        <>
          <s className="text-muted"><span className="sr-only">Originally </span>{taka(product.compareAt)}</s>
          <span className="text-xs uppercase tracking-[0.14em] text-campaign">{labels.saveWord} {taka(product.compareAt - product.price)}</span>
        </>
      )}
    </p>
  );
}
