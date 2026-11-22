"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { productHref } from "@/lib/format";
import { useStore } from "../StoreProvider";
import { Panel } from "../ui/Panel";
import { Photo } from "../ui/Photo";
import { Price } from "../shop/Price";
import { Purchase } from "../shop/Purchase";

export function QuickView() {
  const { panel, close, quickProduct: p } = useStore();
  const open = panel === "quick" && !!p;
  return (
    <Panel open={open} onClose={close} side="center" label={p ? `Quick view: ${p.name}` : "Quick view"}>
      {p && (
        <div className="grid max-h-[92dvh] overflow-y-auto md:grid-cols-2">
          <button className="icon-btn absolute right-2 top-2 z-10 bg-page" onClick={close} aria-label="Close quick view"><X className="h-5 w-5" strokeWidth={1.25} /></button>
          <div className="relative aspect-square bg-soft"><Photo src={p.images[0]} alt={p.name} sizes="(min-width:768px) 32rem, 94vw" /></div>
          <div className="flex flex-col justify-center p-6 sm:p-10">
            <p className="label text-muted">{p.categoryName}</p>
            <h2 className="display-md mt-3">{p.name}</h2>
            <Price product={p} className="mt-3" />
            <p className="mt-4 text-sm text-muted">{p.description}</p>
            <Purchase key={p.id} product={p} compact />
            <Link href={productHref(p.id)} onClick={close} className="link-line mt-3 self-start"><span>Full details</span></Link>
          </div>
        </div>
      )}
    </Panel>
  );
}
