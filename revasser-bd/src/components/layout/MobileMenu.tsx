"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { NavItem } from "@/lib/types";
import { useStore } from "../StoreProvider";
import { Logo } from "../ui/Logo";
import { Panel } from "../ui/Panel";
import { Photo } from "../ui/Photo";

export function MobileMenu({ nav, showTrack, trackLabel }: { nav: NavItem[]; showTrack: boolean; trackLabel: string }) {
  const { panel, close, data, user, open: openPanel } = useStore();
  const open = panel === "menu";
  const small = [
    ["Pre-order fashion", "/pre-order"],
    ["My Revasser", "/account"],
    ["Wishlist", "/wishlist"],
    ["Our story", "/about"],
    ["Help & contact", "/contact"],
    ...(showTrack && trackLabel ? [[trackLabel, "/track-order"]] : []),
  ];
  return (
    <Panel open={open} onClose={close} side="left" label="Menu">
      {/* A link to the page you are already on would not change the path, so close on any link. */}
      <div className="flex h-full flex-col overflow-y-auto" onClick={(e) => (e.target as Element).closest("a") && close()}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink/10 pl-5 pr-2">
          <Logo className="h-6 w-auto" />
          <button className="icon-btn" onClick={close} aria-label="Close menu"><X className="h-5 w-5" strokeWidth={1.25} /></button>
        </div>
        <nav aria-label="Mobile" className="px-5 pt-5">
          <ul>
            {[{ label: "Shop all", href: "/shop" }, ...nav].map((n) => (
              <li key={n.href + n.label}>
                <Link href={n.href} className="block py-2 font-serif text-[2rem] leading-tight">{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <ul className="no-bar mt-7 flex shrink-0 snap-x scroll-px-5 gap-3 overflow-x-auto px-5">
          {open && data.collections.map((c) => (
            <li key={c.id} className="w-36 shrink-0 snap-start">
              <Link href={`/shop/${c.slug}`}>
                <span className="relative block aspect-[4/5] overflow-hidden bg-soft"><Photo src={c.image} alt="" sizes="144px" /></span>
                <span className="mt-2 block text-sm leading-snug">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
        {data.checkout.googleClientId && (
          <div className="mt-7 px-5">
            <button className="btn-dark w-full" onClick={() => openPanel("signin")}>{user ? "My account" : "Login / Register"}</button>
          </div>
        )}
        <ul className="mt-7 grid grid-cols-2 gap-x-4 border-t border-ink/10 px-5 pb-8 pt-4">
          {small.map(([label, href]) => (
            <li key={href}><Link href={href} className="flex min-h-11 items-center text-sm">{label}</Link></li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
