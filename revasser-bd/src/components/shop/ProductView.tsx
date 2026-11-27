"use client";

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn } from "lucide-react";
import type { Product } from "@/lib/types";
import { Panel } from "../ui/Panel";
import { Photo } from "../ui/Photo";
import { useStore } from "../StoreProvider";
import { Price } from "./Price";
import { Purchase } from "./Purchase";

const AVAILABILITY: Record<string, string> = {
  "In stock": "In stock",
  "Pre-order": "Available on pre-order",
  "Sold out": "Currently sold out",
  "Confirm by phone": "We confirm availability by phone after you order",
  "": "We confirm availability by phone after you order",
};

export function ProductView({ product: p, children }: { product: Product; children: React.ReactNode }) {
  const { viewed, ready } = useStore();
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const track = useRef<HTMLUListElement>(null);
  // A colour photo may not be one of the gallery photos, so it joins the end.
  const images = Array.from(new Set([...p.images, ...p.colours.map((c) => c.image).filter(Boolean)]));

  useEffect(() => {
    if (ready) viewed(p.id);
  }, [ready, p.id, viewed]);

  function go(i: number) {
    if (i < 0) return;
    const el = track.current;
    el?.scrollTo({ left: el.clientWidth * i, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setIndex(i);
  }

  return (
    <div className="grid gap-x-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:gap-x-24">
      <div className="lg:grid lg:grid-cols-[5rem_minmax(0,1fr)] lg:items-start lg:gap-4">
        <div className="relative -mx-5 sm:mx-0 lg:order-2">
          <ul
            ref={track}
            onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="no-bar flex snap-x snap-mandatory overflow-x-auto bg-soft"
            aria-label={`${p.name} photographs`}
            tabIndex={0}
          >
            {images.map((src, i) => (
              <li key={src} className="relative aspect-square w-full shrink-0 snap-center">
                <Photo src={src} alt={`${p.name}, photograph ${i + 1} of ${images.length}`} sizes="(min-width:1024px) 50vw, 100vw" priority={i === 0} />
              </li>
            ))}
          </ul>
          {images.length > 0 && (
            <button onClick={() => setZoom(true)} className="icon-btn absolute bottom-0 right-0 bg-page/90" aria-label="Enlarge photograph">
              <ZoomIn className="h-[18px] w-[18px]" strokeWidth={1.25} />
            </button>
          )}
        </div>
        {images.length > 1 && (
          <ul className="mt-3 flex gap-2 overflow-x-auto lg:order-1 lg:mt-0 lg:flex-col">
            {images.map((src, i) => (
              <li key={src} className="shrink-0">
                <button
                  onClick={() => go(i)}
                  aria-label={`Show photograph ${i + 1}`}
                  aria-current={index === i}
                  className="relative block h-16 w-16 overflow-hidden border border-transparent bg-soft aria-[current=true]:border-ink lg:h-20 lg:w-20"
                >
                  <Photo src={src} alt="" sizes="80px" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-8 lg:sticky lg:top-40 lg:self-start lg:pt-2">
        {p.categoryName && <p className="label text-muted">{p.categoryName}</p>}
        <h1 className="display-md mt-4">{p.name}</h1>
        <Price product={p} className="mt-4 text-lg" />
        <p className="mt-2 flex items-center gap-2.5 text-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${p.availability === "In stock" ? "bg-green-800" : p.availability === "Sold out" ? "bg-red-800" : "bg-accent"}`} aria-hidden="true" />
          {AVAILABILITY[p.availability]}
        </p>
        {p.description && <p className="mt-6 max-w-lg whitespace-pre-line text-muted">{p.description}</p>}
        <Purchase product={p} onColour={(image) => go(images.indexOf(image))} />
        {children}
      </div>

      <Panel open={zoom} onClose={() => setZoom(false)} side="center" label={`${p.name}, enlarged`}>
        <button className="icon-btn absolute right-2 top-2 z-10 bg-page" onClick={() => setZoom(false)} aria-label="Close enlarged photograph"><X className="h-5 w-5" /></button>
        <div className="relative h-[88dvh] w-full bg-soft">
          {zoom && <Photo src={images[index] ?? images[0]} alt={p.name} sizes="94vw" className="!object-contain" />}
        </div>
      </Panel>
    </div>
  );
}
