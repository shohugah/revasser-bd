"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { matches } from "@/lib/search";
import { Panel } from "../ui/Panel";
import { ProductCard } from "./ProductCard";

interface Props {
  products: Product[];
  labels: { featured: string; newest: string; low: string; high: string; emptyTitle: string; emptyText: string };
  /** Where an empty edit sends people instead of a dead end. */
  emptyAction: { label: string; href: string };
}

export function Grid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:gap-y-16 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}><ProductCard product={p} priority={i < 2} heading="h2" sizes="(min-width:1280px) 24vw, (min-width:768px) 32vw, 50vw" /></li>
      ))}
    </ul>
  );
}

/** Shown until the filters hydrate. It holds the toolbar's exact height so the grid never moves. */
export function ListingFallback({ products }: { products: Product[] }) {
  return (
    <>
      <div className="mb-8 box-content h-14 border-y border-ink/10" />
      <Grid products={products} />
    </>
  );
}

export function Empty({ title, text, action }: { title: string; text: string; action: { label: string; href: string } }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
      <img src="/brand/logo/monogram-gold.svg" alt="" className="h-20 w-20" />
      <h2 className="display-md mt-8">{title}</h2>
      <p className="mt-4 text-muted">{text}</p>
      <Link href={action.href} className="btn-dark mt-8">{action.label}</Link>
    </div>
  );
}

export function Listing({ products, labels, emptyAction }: Props) {
  const params = useSearchParams();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  // The address holds the state, so a filtered view can be shared and Back works.
  function change(update: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    update(next);
    const query = next.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  const q = params.get("q")?.trim() ?? "";
  const options = (pick: (p: Product) => string[]) => Array.from(new Set(products.flatMap(pick))).filter(Boolean);

  // A filter only appears when it can actually narrow this edit.
  const filters = [
    { key: "category", name: "Department", pick: (p: Product) => [p.categoryName] },
    { key: "colour", name: "Colour", pick: (p: Product) => p.colours.map((c) => c.name) },
    { key: "size", name: "Size", pick: (p: Product) => p.sizes },
    { key: "availability", name: "Availability", pick: (p: Product) => [p.availability || "Confirm by phone"] },
    { key: "edit", name: "Edit", pick: (p: Product) => [p.isNew ? "New in" : "", p.bestSeller ? "Best sellers" : "", p.compareAt ? "Reduced" : ""] },
    {
      key: "price",
      name: "Price",
      pick: (p: Product) => [p.price === null ? "" : p.price < 1000 ? "Under ৳1,000" : p.price < 3000 ? "৳1,000 to ৳2,999" : "৳3,000 and above"],
    },
  ]
    .map((f) => ({ ...f, values: options(f.pick) }))
    .filter((f) => f.values.length > 1 || (f.values.length === 1 && products.some((p) => !f.pick(p).includes(f.values[0]))));

  const active = filters.flatMap((f) => params.getAll(f.key).map((value) => ({ key: f.key, value })));
  const priced = products.filter((p) => p.price !== null).length > 1;
  const sort = params.get("sort") ?? "";

  const shown = products
    .filter((p) => !q || matches(p, q))
    .filter((p) =>
      filters.every((f) => {
        const chosen = params.getAll(f.key);
        return !chosen.length || f.pick(p).some((v) => chosen.includes(v));
      })
    )
    .sort((a, b) => {
      if (sort === "new") return Number(b.isNew) - Number(a.isNew) || a.order - b.order;
      if (sort === "low" || sort === "high") {
        // Pieces priced on request always come after priced ones.
        if (a.price === null || b.price === null) return Number(a.price === null) - Number(b.price === null);
        return sort === "low" ? a.price - b.price : b.price - a.price;
      }
      return a.order - b.order;
    });

  if (!products.length) return <Empty title={labels.emptyTitle} text={labels.emptyText} action={emptyAction} />;

  const reset = () =>
    change((next) => ["q", ...filters.map((f) => f.key)].forEach((key) => next.delete(key)));

  return (
    <>
      <div className="mb-8 flex min-h-14 flex-wrap items-center justify-between gap-x-4 border-y border-ink/10">
        {filters.length > 0 ? (
          <button onClick={() => setDrawer(true)} className="flex min-h-14 items-center gap-3 text-xs uppercase tracking-[0.18em]" aria-haspopup="dialog">
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.25} /> Filter{active.length > 0 && ` (${active.length})`}
          </button>
        ) : <span />}
        <p role="status" className="hidden text-sm text-muted sm:block">{shown.length} {shown.length === 1 ? "piece" : "pieces"}</p>
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]">
          <span className="sr-only sm:not-sr-only">Sort</span>
          <select
            value={sort}
            onChange={(e) => change((next) => (e.target.value ? next.set("sort", e.target.value) : next.delete("sort")))}
            className="h-14 max-w-[11rem] cursor-pointer bg-transparent text-right uppercase tracking-[0.12em]"
          >
            <option value="">{labels.featured}</option>
            <option value="new">{labels.newest}</option>
            {priced && <option value="low">{labels.low}</option>}
            {priced && <option value="high">{labels.high}</option>}
          </select>
        </label>
      </div>

      {(q || active.length > 0) && (
        <ul className="mb-7 flex flex-wrap items-center gap-2">
          {[...(q ? [{ key: "q", value: q }] : []), ...active].map(({ key, value }) => (
            <li key={key + value}>
              <button
                className="flex min-h-10 items-center gap-2 border border-ink/20 px-3 text-sm"
                aria-label={`Remove ${value}`}
                onClick={() => change((next) => {
                  const keep = next.getAll(key).filter((v) => key !== "q" && v !== value);
                  next.delete(key);
                  keep.forEach((v) => next.append(key, v));
                })}
              >
                {key === "q" ? `“${value}”` : value} <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          <li><button onClick={reset} className="min-h-10 px-2 text-sm underline underline-offset-4">Clear all</button></li>
        </ul>
      )}

      {shown.length ? (
        <Grid products={shown} />
      ) : (
        <div className="py-20 text-center" role="status">
          <h2 className="display-md">Nothing matches that yet.</h2>
          <button onClick={reset} className="btn-line mt-7">Clear search and filters</button>
        </div>
      )}

      <Panel open={drawer} onClose={() => setDrawer(false)} side="left" label="Filters">
        <div className="flex h-full flex-col">
          <div className="flex h-20 shrink-0 items-center justify-between border-b border-ink/10 pl-6 pr-3">
            <h2 className="text-3xl">Filter</h2>
            <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close filters"><X className="h-5 w-5" strokeWidth={1.25} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-3">
            {filters.map((f) => (
              <fieldset key={f.key} className="border-b border-ink/10 py-5 last:border-0">
                <legend className="label float-left mb-2 w-full text-muted">{f.name}</legend>
                {f.values.map((v) => (
                  <label key={v} className="flex min-h-11 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-[18px] w-[18px] accent-ink"
                      checked={params.getAll(f.key).includes(v)}
                      onChange={(e) => change((next) => {
                        const keep = next.getAll(f.key).filter((x) => x !== v);
                        next.delete(f.key);
                        (e.target.checked ? [...keep, v] : keep).forEach((x) => next.append(f.key, x));
                      })}
                    />
                    {v}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <div className="shrink-0 border-t border-ink/10 p-5">
            <button className="btn-dark w-full" onClick={() => setDrawer(false)}>Show {shown.length} {shown.length === 1 ? "piece" : "pieces"}</button>
          </div>
        </div>
      </Panel>
    </>
  );
}
