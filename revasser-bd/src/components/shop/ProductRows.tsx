"use client";

import type { Product } from "@/lib/types";
import { useStore } from "../StoreProvider";
import { ProductCard } from "./ProductCard";

export function ProductRow({ title, products }: { title: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="mt-20 border-t border-ink/10 pt-12 lg:mt-28">
      <h2 className="display-md">{title}</h2>
      <ul className="mt-9 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
        {products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
      </ul>
    </section>
  );
}

export function RecentlyViewed({ exclude }: { exclude: string }) {
  const { recent } = useStore();
  return <ProductRow title="Recently viewed" products={recent.filter((p) => p.id !== exclude).slice(0, 4)} />;
}
