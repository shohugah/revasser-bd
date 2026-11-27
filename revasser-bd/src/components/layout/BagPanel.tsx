"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { productHref, taka } from "@/lib/format";
import { useStore } from "../StoreProvider";
import { Panel } from "../ui/Panel";
import { Photo } from "../ui/Photo";

export function BagPanel() {
  const { panel, close, data, lines, count, subtotal, hasUnpriced, setQuantity } = useStore();
  const c = data.checkout;
  return (
    <Panel open={panel === "bag"} onClose={close} side="right" label={c.bagTitle || "Shopping bag"}>
      <div className="flex h-full flex-col" onClick={(e) => (e.target as Element).closest("a") && close()}>
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-ink/10 pl-6 pr-3">
          <h2 className="text-3xl">{c.bagTitle} {count > 0 && <span className="align-top font-sans text-sm text-muted">{count}</span>}</h2>
          <button className="icon-btn" onClick={close} aria-label="Close bag"><X className="h-5 w-5" strokeWidth={1.25} /></button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-7 px-8 text-center">
            <img src="/brand/logo/monogram-gold.svg" alt="" className="h-20 w-20" />
            <p className="font-serif text-2xl">{c.emptyBag}</p>
            <Link href="/shop" className="btn-dark">Explore the edit</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto overscroll-contain px-6" aria-live="polite">
              {lines.map(({ id, option, quantity, product }) => {
                const image = product.colours.find((k) => option.split(" / ").includes(k.name))?.image || product.images[0];
                return (
                  <li key={id + option} className="flex gap-4 py-5">
                    <Link href={productHref(id)} className="relative h-24 w-24 shrink-0 overflow-hidden bg-soft">
                      <Photo src={image} alt={product.name} sizes="96px" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex justify-between gap-3">
                        <Link href={productHref(id)} className="text-sm leading-snug">{product.name}</Link>
                        <p className="shrink-0 text-sm">{product.price === null ? "" : taka(product.price * quantity)}</p>
                      </div>
                      {option && <p className="text-xs text-muted">{option}</p>}
                      {product.price === null && <p className="text-xs text-red-800">{data.labels.priceOnRequest}. Remove to check out.</p>}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center border border-ink/20">
                          <button className="flex h-10 w-10 items-center justify-center" onClick={() => setQuantity(id, option, quantity - 1)} aria-label={`One fewer ${product.name}`}><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-7 text-center text-sm">{quantity}</span>
                          <button className="flex h-10 w-10 items-center justify-center" onClick={() => setQuantity(id, option, quantity + 1)} aria-label={`One more ${product.name}`}><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <button className="min-h-10 text-xs text-muted underline underline-offset-4 hover:text-ink" onClick={() => setQuantity(id, option, 0)} aria-label={`Remove ${product.name}`}>Remove</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="shrink-0 border-t border-ink/10 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p>{hasUnpriced ? "—" : taka(subtotal)}</p>
              </div>
              <p className="mt-1 text-xs text-muted">
                Delivery {taka(c.insideFee)} {c.insideLabel}, {taka(c.outsideFee)} {c.outsideLabel}.
              </p>
              <Link href="/checkout" className="btn-dark mt-5 w-full">{c.checkoutButton}</Link>
              <button onClick={close} className="mt-1 min-h-11 w-full text-xs uppercase tracking-[0.18em]">Keep shopping</button>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}
