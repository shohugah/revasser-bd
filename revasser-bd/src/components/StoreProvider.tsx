"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Product, StoreData } from "@/lib/types";

// Everything here lives in the visitor's own browser. There is no account server.
const KEY = "revasser:v1";
const MAX_QTY = 20;

export interface BagLine { id: string; option: string; quantity: number }
export interface SavedOrder {
  reference: string;
  date: string;
  items: { name: string; option: string; quantity: number; price: number | null }[];
  url: string;
  /** True only after the customer tells us they pressed Send. It is never a confirmation. */
  sent: boolean;
}
export interface Details { customerName: string; phone: string; email: string; district: string; area: string; address: string }
interface Saved { bag: BagLine[]; wishlist: string[]; recent: string[]; orders: SavedOrder[]; details: Details | null }
type PanelName = "" | "menu" | "search" | "bag" | "quick";

const EMPTY: Saved = { bag: [], wishlist: [], recent: [], orders: [], details: null };

function load(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}") ?? {};
    const array = (x: unknown) => (Array.isArray(x) ? x : []);
    return {
      bag: array(v.bag).filter((l) => l && typeof l.id === "string" && Number.isInteger(l.quantity) && l.quantity > 0),
      wishlist: array(v.wishlist).filter((x) => typeof x === "string"),
      recent: array(v.recent).filter((x) => typeof x === "string"),
      orders: array(v.orders).filter((o) => o && typeof o.reference === "string" && Array.isArray(o.items) && String(o.url).startsWith("https://wa.me/")),
      details: v.details && typeof v.details === "object" ? v.details : null,
    };
  } catch {
    return EMPTY; // Storage can be blocked or hold something unreadable.
  }
}

function useStoreValue(data: StoreData) {
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<PanelName>("");
  const [quickId, setQuickId] = useState("");
  const [toast, setToast] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    setSaved(load());
    setReady(true);
    const sync = (e: StorageEvent) => e.key === KEY && setSaved(load());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      const next = JSON.stringify(saved);
      if (next !== localStorage.getItem(KEY)) localStorage.setItem(KEY, next);
    } catch {
      // Private browsing: the bag still works until the tab closes.
    }
  }, [saved, ready]);

  useEffect(() => setPanel(""), [pathname]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const byId = useMemo(() => new Map(data.products.map((p) => [p.id, p])), [data.products]);

  // Lines whose product was hidden, deleted or sold out drop out by themselves.
  const lines = useMemo(
    () =>
      saved.bag.flatMap((line) => {
        const product = byId.get(line.id);
        return product && product.availability !== "Sold out" ? [{ ...line, product }] : [];
      }),
    [saved.bag, byId]
  );

  const add = useCallback((id: string, option: string, quantity = 1) => {
    setSaved((s) => {
      const found = s.bag.find((l) => l.id === id && l.option === option);
      const bag = found
        ? s.bag.map((l) => (l === found ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l))
        : [...s.bag, { id, option, quantity: Math.min(MAX_QTY, quantity) }];
      return { ...s, bag };
    });
    setPanel("bag");
  }, []);

  const setQuantity = useCallback((id: string, option: string, quantity: number) => {
    setSaved((s) => ({
      ...s,
      bag: s.bag
        .map((l) => (l.id === id && l.option === option ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l))
        .filter((l) => l.quantity > 0),
    }));
  }, []);

  const toggleWish = (product: Product) => {
    const on = saved.wishlist.includes(product.id);
    setSaved((s) => ({ ...s, wishlist: on ? s.wishlist.filter((x) => x !== product.id) : [product.id, ...s.wishlist] }));
    setToast(on ? "Removed from your wishlist" : "Saved to your wishlist");
  };

  const viewed = useCallback((id: string) => {
    setSaved((s) => (s.recent[0] === id ? s : { ...s, recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 12) }));
  }, []);

  const recordOrder = (order: SavedOrder, details: Details | null) =>
    setSaved((s) => ({ ...s, details, orders: [order, ...s.orders.filter((o) => o.reference !== order.reference)].slice(0, 30) }));

  const markSent = (reference: string) =>
    setSaved((s) => ({ ...s, bag: [], orders: s.orders.map((o) => (o.reference === reference ? { ...o, sent: true } : o)) }));

  return {
    data,
    ready,
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: lines.reduce((n, l) => n + (l.product.price ?? 0) * l.quantity, 0),
    hasUnpriced: lines.some((l) => l.product.price === null),
    wishlist: saved.wishlist.flatMap((id) => byId.get(id) ?? []),
    recent: saved.recent.flatMap((id) => byId.get(id) ?? []),
    orders: saved.orders,
    details: saved.details,
    isWished: (id: string) => saved.wishlist.includes(id),
    add,
    setQuantity,
    clearBag: () => setSaved((s) => ({ ...s, bag: [] })),
    toggleWish,
    viewed,
    recordOrder,
    markSent,
    forget: () => {
      setSaved(EMPTY);
      setToast("Everything saved on this device was cleared");
    },
    panel,
    open: setPanel,
    close: () => setPanel(""),
    quickProduct: byId.get(quickId),
    quickView: (id: string) => {
      setQuickId(id);
      setPanel("quick");
    },
    toast,
  };
}

const Context = createContext<ReturnType<typeof useStoreValue> | null>(null);

export function StoreProvider({ data, children }: { data: StoreData; children: React.ReactNode }) {
  const value = useStoreValue(data);
  return (
    <Context.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-5">
        {value.toast && <p className="toast bg-ink px-6 py-3.5 text-sm text-page">{value.toast}</p>}
      </div>
    </Context.Provider>
  );
}

export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
