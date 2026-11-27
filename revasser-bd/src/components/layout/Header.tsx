"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import type { NavItem } from "@/lib/types";
import { productHref } from "@/lib/format";
import { useStore } from "../StoreProvider";
import { Logo } from "../ui/Logo";
import { Photo } from "../ui/Photo";

export interface HeaderProps {
  nav: NavItem[];
  announcements: string[];
  logoImage: string;
  badge: string;
  searchPlaceholder: string;
  trackLabel: string;
  showTrack: boolean;
}

function Announcements({ items }: { items: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length, paused]);

  if (!items.length) return null;
  return (
    <div className="bg-campaign text-page" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <p className="shell flex h-9 items-center justify-center truncate text-center text-[11px] uppercase tracking-[0.18em]">
        {items[index % items.length]}
      </p>
    </div>
  );
}

export function Header({ nav, announcements, logoImage, badge, searchPlaceholder, trackLabel, showTrack }: HeaderProps) {
  const store = useStore();
  const { categories, collections, products } = store.data;
  const pathname = usePathname();
  const [menu, setMenu] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => setMenu(""), [pathname]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu("");
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const show = (key: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMenu(key), menu ? 0 : 120);
  };
  const hide = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMenu(""), 160);
  };

  // A nav item gets a preview panel when it points at a category or collection.
  const previews = nav.flatMap((item) => {
    const slug = item.href.startsWith("/shop/") ? item.href.slice(6) : "";
    const collection = collections.find((c) => c.slug === slug);
    const category = categories.find((c) => c.slug === slug);
    const found = collection ?? category;
    if (!found) return [];
    const within = collection ? collection.categories : [slug];
    return [{
      ...item,
      title: found.name,
      image: found.image,
      description: found.description,
      departments: collection ? categories.filter((c) => within.includes(c.slug)) : [],
      pieces: products.filter((p) => within.includes(p.category)).slice(0, 3),
    }];
  });

  const navLink = "flex h-12 items-center text-xs uppercase tracking-[0.18em] transition-opacity hover:opacity-60";

  return (
    <>
      <Announcements items={announcements} />
      <header
        className="sticky top-0 z-30 border-b border-ink/10 bg-page"
        onMouseLeave={hide}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setMenu("")}
      >
        <div className="shell grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-20">
          <div className="-ml-3 flex items-center">
            <button className="icon-btn lg:hidden" onClick={() => store.open("menu")} aria-label="Open menu" aria-haspopup="dialog">
              <Menu className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <button
              className="hidden h-11 items-center gap-3 pl-3 text-sm text-muted transition-colors hover:text-ink lg:flex"
              onClick={() => store.open("search")}
              aria-haspopup="dialog"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.25} />
              <span>
                <span className="sr-only">Search: </span>
                {searchPlaceholder}
              </span>
            </button>
          </div>

          <Link href="/" aria-label="Revasser home" className="flex items-center gap-3">
            <Logo uploaded={logoImage} className="h-[26px] w-auto max-w-[44vw] sm:h-8 lg:h-10" />
            {badge && <span className="label hidden text-muted xl:inline">{badge}</span>}
          </Link>

          <div className="-mr-3 flex items-center justify-end">
            {showTrack && trackLabel && (
              <Link href="/track-order" className="mr-3 hidden text-xs uppercase tracking-[0.18em] hover:opacity-60 xl:inline">
                {trackLabel}
              </Link>
            )}
            <button className="icon-btn hidden sm:inline-flex lg:hidden" onClick={() => store.open("search")} aria-label="Search">
              <Search className="h-5 w-5" strokeWidth={1.25} />
            </button>
            {store.data.checkout.googleClientId && (
              <button className="mr-2 hidden h-11 whitespace-nowrap text-xs uppercase tracking-[0.14em] hover:opacity-60 lg:block" onClick={() => store.open("signin")} aria-haspopup="dialog">
                {store.user ? `Hi, ${store.user.name.split(" ")[0] || "there"}` : "Login / Register"}
              </button>
            )}
            <Link href="/account" className="icon-btn hidden lg:inline-flex" aria-label="My Revasser">
              <User className="h-5 w-5" strokeWidth={1.25} />
            </Link>
            <Link href="/wishlist" className="icon-btn hidden sm:inline-flex" aria-label={`Wishlist, ${store.wishlist.length} saved`}>
              <Heart className="h-5 w-5" strokeWidth={1.25} />
              {store.wishlist.length > 0 && <span className="count">{store.wishlist.length}</span>}
            </Link>
            <button className="icon-btn sm:hidden" onClick={() => store.open("search")} aria-label="Search">
              <Search className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <button className="icon-btn" onClick={() => store.open("bag")} aria-label={`Shopping bag, ${store.count} items`} aria-haspopup="dialog">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
              {store.count > 0 && <span className="count">{store.count}</span>}
            </button>
          </div>
        </div>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex justify-center gap-x-9 xl:gap-x-12">
            <li>
              <Link
                href="/shop"
                className={navLink}
                aria-expanded={menu === "shop"}
                aria-controls="mega-shop"
                onMouseEnter={() => show("shop")}
                onFocus={() => show("shop")}
              >
                Shop
              </Link>
            </li>
            {nav.map((item) => {
              const has = previews.some((p) => p.href === item.href);
              return (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className={`${navLink} ${pathname === item.href ? "underline decoration-accent underline-offset-[10px]" : ""}`}
                    aria-current={pathname === item.href ? "page" : undefined}
                    aria-expanded={has ? menu === item.href : undefined}
                    onMouseEnter={() => (has ? show(item.href) : hide())}
                    onFocus={() => (has ? show(item.href) : setMenu(""))}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div id="mega-shop" className="mega absolute inset-x-0 top-full border-y border-ink/10 bg-page" data-open={menu === "shop"} onMouseEnter={() => show("shop")}>
            <div className="shell grid grid-cols-[minmax(0,17rem)_1fr] gap-16 py-12">
              <div>
                <p className="label mb-5 text-muted">Departments</p>
                <ul className="space-y-1">
                  {categories.map((c) => (
                    <li key={c.id}>
                      <Link href={`/shop/${c.slug}`} className="block py-1.5 hover:underline hover:underline-offset-4">{c.name}</Link>
                    </li>
                  ))}
                </ul>
                <Link href="/shop" className="link-line mt-5"><span>Shop everything</span></Link>
              </div>
              <ul className="grid max-w-5xl grid-cols-3 gap-5 justify-self-end">
                {collections.slice(0, 3).map((c) => (
                  <li key={c.id}>
                    <Link href={`/shop/${c.slug}`} className="group block">
                      <div className="relative aspect-[4/5] w-[19vw] max-w-[20rem] overflow-hidden bg-soft">
                        {menu === "shop" && <Photo src={c.image} alt="" sizes="20vw" className="transition-transform duration-1000 ease-silk group-hover:scale-[1.03]" />}
                      </div>
                      <p className="mt-4 font-serif text-2xl">{c.name}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {previews.map((p) => (
            <div key={p.href + p.label} className="mega absolute inset-x-0 top-full border-y border-ink/10 bg-page" data-open={menu === p.href} onMouseEnter={() => show(p.href)}>
              <div className="shell grid grid-cols-[minmax(0,24rem)_1fr] gap-16 py-12">
                <div className="flex flex-col items-start">
                  <p className="display-md">{p.title}</p>
                  <p className="mt-4 text-muted">{p.description}</p>
                  {p.departments.length > 0 && (
                    <ul className="mt-6 space-y-1">
                      {p.departments.map((d) => (
                        <li key={d.id}>
                          <Link href={`/shop/${d.slug}`} className="block py-1.5 hover:underline hover:underline-offset-4">{d.name}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href={p.href} className="link-line mt-auto pt-8"><span>View {p.label}</span></Link>
                </div>
                <ul className="flex justify-end gap-5">
                  {p.pieces.map((piece) => (
                    <li key={piece.id} className="w-[18vw] max-w-[19rem]">
                      <Link href={productHref(piece.id)} className="block">
                        <div className="relative aspect-square overflow-hidden bg-soft">
                          {menu === p.href && <Photo src={piece.images[0]} alt="" sizes="20vw" />}
                        </div>
                        <p className="mt-3 text-sm">{piece.name}</p>
                      </Link>
                    </li>
                  ))}
                  {p.pieces.length === 0 && (
                    <li className="relative aspect-[3/2] w-[38vw] max-w-[40rem] overflow-hidden bg-soft">
                      {menu === p.href && <Photo src={p.image} alt="" sizes="40vw" className="object-[50%_25%]" />}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </nav>
      </header>
    </>
  );
}
