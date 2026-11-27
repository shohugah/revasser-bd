"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { productHref } from "@/lib/format";
import { matches } from "@/lib/search";
import { useStore } from "../StoreProvider";
import { Panel } from "../ui/Panel";
import { Photo } from "../ui/Photo";
import { Price } from "../shop/Price";

const PAGES = [
  ["Pre-order Pakistani fashion", "/pre-order", "pre-order preorder pakistani pakistan dress kurti kurta kaftan fashion"],
  ["Delivery", "/delivery", "delivery shipping courier fee dhaka"],
  ["Exchanges & returns", "/returns", "exchange return refund defect"],
  ["Payments", "/payments", "payment cash cod cash on delivery"],
  ["Help & contact", "/contact", "help contact support email whatsapp phone"],
  ["Our story", "/about", "about story brand"],
];

export function SearchPanel({ placeholder }: { placeholder: string }) {
  const { panel, close, data } = useStore();
  const open = panel === "search";
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) requestAnimationFrame(() => input.current?.focus());
    else setQ("");
  }, [open]);

  const term = q.trim().toLowerCase();
  const products = term ? data.products.filter((p) => matches(p, term)).slice(0, 4) : data.products.slice(0, 4);
  const departments = (term
    ? data.categories.filter((c) => c.name.toLowerCase().includes(term))
    : data.categories.filter((c) => c.featured)
  ).slice(0, 5);
  const pages = term ? PAGES.filter(([label, , words]) => `${label.toLowerCase()} ${words}`.includes(term)) : PAGES.slice(0, 2);
  const none = term && !products.length && !departments.length && !pages.length;

  return (
    <Panel open={open} onClose={close} side="top" label="Search">
      <div className="max-h-[92dvh] overflow-y-auto" onClick={(e) => (e.target as Element).closest("a") && close()}>
        <div className="shell py-4 sm:py-8">
          <form
            role="search"
            className="flex items-center gap-3 border-b border-ink/40"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
              close();
            }}
          >
            <Search className="h-5 w-5 shrink-0" strokeWidth={1.25} />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              aria-label="Search the shop"
              enterKeyHint="search"
              autoComplete="off"
              className="h-16 min-w-0 flex-1 bg-transparent font-serif text-xl outline-none placeholder:text-muted/80 sm:text-3xl"
            />
            <button type="button" className="icon-btn" onClick={close} aria-label="Close search"><X className="h-5 w-5" strokeWidth={1.25} /></button>
          </form>

          {open && (
            <div className="grid gap-8 py-7 md:grid-cols-[15rem_1fr] md:gap-14">
              <div className="space-y-6">
                {departments.length > 0 && (
                  <div>
                    <p className="label mb-2 text-muted">Departments</p>
                    <ul>{departments.map((c) => <li key={c.id}><Link href={`/shop/${c.slug}`} className="block py-2 hover:underline">{c.name}</Link></li>)}</ul>
                  </div>
                )}
                {pages.length > 0 && (
                  <div>
                    <p className="label mb-2 text-muted">Pages</p>
                    <ul>{pages.map(([label, href]) => <li key={href}><Link href={href} className="block py-2 hover:underline">{label}</Link></li>)}</ul>
                  </div>
                )}
              </div>
              <div className={products.length ? "order-first md:order-none" : ""}>
                {none && (
                  <p aria-live="polite" className="py-6 font-serif text-2xl">
                    Nothing matches “{q}”. <Link href="/contact" className="underline underline-offset-4">Ask us for it</Link>
                  </p>
                )}
                {products.length > 0 && (
                  <>
                    <p className="label mb-4 text-muted">{term ? "Pieces" : "From the edit"}</p>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
                      {products.map((p) => (
                        <li key={p.id}>
                          <Link href={productHref(p.id)} className="block">
                            <span className="relative block aspect-square overflow-hidden bg-soft"><Photo src={p.images[0]} alt="" sizes="(min-width:640px) 22vw, 45vw" /></span>
                            <span className="mt-2 block text-sm leading-snug">{p.name}</span>
                          </Link>
                          <Price product={p} className="text-xs" />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
