"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AVAILABILITY, FIELDS, problemWith, shopState, type Field, type SheetProduct } from "@/lib/product-edit";

type Row = SheetProduct & { onSite: boolean };
const FILTERS = ["All", "Stock Out", "Low Stock", "Hidden"] as const;
const taka = (n: number | null) => (n === null ? "—" : `Tk ${n.toLocaleString("en-US")}`);
const input = "mt-1 block min-h-11 w-full border border-[#8c8f94] bg-white px-3 text-base";
const primary = "min-h-11 bg-[#2271b1] px-5 text-sm text-white disabled:opacity-50";
const secondary = "min-h-11 border border-[#2271b1] bg-white px-4 text-sm text-[#2271b1]";

export function ProductEditor({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [list, setList] = useState(rows);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [editing, setEditing] = useState<Row | null>(null);
  const [saved, setSaved] = useState("");
  useEffect(() => setList(rows), [rows]);

  const words = search.trim().toLowerCase();
  const shown = list.filter((p) => (filter === "All" || shopState(p) === filter) && (!words || `${p.name} ${p.id} ${p.category}`.toLowerCase().includes(words)));
  const update = (product: SheetProduct) => setList((all) => all.map((p) => (p.id === product.id ? { ...p, ...product, image: p.image, category: p.category } : p)));

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`min-h-10 border px-3 text-sm ${filter === f ? "border-[#2271b1] bg-[#2271b1] text-white" : "border-[#c3c4c7] bg-white text-[#2271b1]"}`}>
            {f} ({f === "All" ? list.length : list.filter((p) => shopState(p) === f).length})
          </button>
        ))}
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" aria-label="Search products" className="min-h-10 w-full border border-[#8c8f94] bg-white px-3 text-base sm:ml-auto sm:w-64" />
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-[#007017]">{saved}</p>
      <ul className="divide-y divide-[#dcdcde] border border-[#c3c4c7] bg-white">
        {shown.map((p) => {
          const state = shopState(p);
          return (
            <li key={p.id} data-id={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
              {p.image ? <img src={p.image} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 shrink-0 object-cover" /> : <span className="h-14 w-14 shrink-0 bg-[#f0f0f1]" />}
              <div className="min-w-0 flex-1 basis-40">
                <p className="break-words font-semibold">{p.name || p.id}</p>
                <p className="text-xs text-[#646970]">{p.category}{p.onSite ? "" : " · not on website"}</p>
              </div>
              <p className="w-28 text-sm tabular-nums">
                {p.promo !== null && p.regular !== null && p.promo < p.regular ? <><s className="text-[#646970]">{taka(p.regular)}</s><br />{taka(p.promo)}</> : taka(p.regular)}
              </p>
              <p className="w-20 text-sm tabular-nums">Stock: {p.stock ?? "—"}</p>
              <p className={`w-28 text-sm ${state === "Stock Out" ? "text-[#b32d2e]" : state === "Low Stock" ? "text-[#8a5700]" : state === "Hidden" ? "text-[#646970]" : "text-[#007017]"}`}>{state}</p>
              <button onClick={() => { setSaved(""); setEditing(p); }} className={secondary} aria-label={`Edit ${p.name || p.id}`}>Edit</button>
              {p.onSite && <Link href={`/admin/products/${p.id}`} className={`${secondary} flex items-center`} aria-label={`Photos and details of ${p.name || p.id}`}>Photos &amp; details</Link>}
            </li>
          );
        })}
        {!shown.length && <li className="p-4 text-sm text-[#646970]">No products match.</li>}
      </ul>
      {editing && (
        <EditDialog
          key={editing.id}
          start={editing}
          onClose={() => setEditing(null)}
          onChanged={update}
          onSaved={(product) => {
            update(product);
            setSaved(`Saved ${product.name}. The shop updates in a moment.`);
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

const toText = (p: SheetProduct) => ({ name: p.name, regular: p.regular?.toString() ?? "", promo: p.promo?.toString() ?? "", stock: p.stock?.toString() ?? "", availability: p.availability, show: p.show });

function EditDialog({ start, onClose, onChanged, onSaved }: { start: Row; onClose: () => void; onChanged: (p: SheetProduct) => void; onSaved: (p: SheetProduct) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [base, setBase] = useState<SheetProduct>(start);
  const [form, setForm] = useState(() => toText(start));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!dialog.current?.open) dialog.current?.showModal(); }, []);

  const number = (v: string) => (v.trim() === "" ? null : /^-?\d+$/.test(v.trim()) ? Number(v) : NaN);
  const next: SheetProduct = { id: base.id, name: form.name.trim(), regular: number(form.regular), promo: number(form.promo), stock: number(form.stock), availability: form.availability, show: form.show };
  // Compare what was typed, so an untouched box never overwrites the sheet.
  const original = toText(base);
  const changed = FIELDS.filter((f) => form[f] !== original[f] && next[f] !== base[f]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const problem = problemWith(next, changed);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    const pick = (from: SheetProduct) => Object.fromEntries(changed.map((f: Field) => [f, from[f]]));
    try {
      const res = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: base.id, expected: { ...pick(base), regular: base.regular, promo: base.promo }, changes: pick(next) }) });
      const reply = await res.json().catch(() => ({}));
      if (res.ok) return onSaved(reply.product);
      if (res.status === 401) return window.location.assign("/admin/login");
      if (reply.product) {
        setBase(reply.product);
        setForm(toText(reply.product));
        onChanged(reply.product);
      }
      setError(reply.error || "The change was not saved.");
    } catch {
      setError("No connection. Reload the page to see what the sheet holds.");
    } finally {
      setBusy(false);
    }
  }

  const field = (key: "name" | "regular" | "promo" | "stock", label: string, hint?: string) => (
    <label className="block text-sm font-semibold">
      {label}
      <input className={input} value={form[key]} inputMode={key === "name" ? "text" : "numeric"} maxLength={key === "name" ? 120 : 9} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      {hint && <span className="mt-1 block text-xs font-normal text-[#646970]">{hint}</span>}
    </label>
  );

  return (
    <dialog ref={dialog} onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }} aria-label={`Edit ${start.name || start.id}`} className="m-auto max-h-[92svh] w-[min(32rem,94vw)] overflow-y-auto border border-[#c3c4c7] bg-white p-0 text-[#1d2327] backdrop:bg-black/50">
      <form onSubmit={save} onChange={() => setError("")} className="space-y-4 p-5">
        <h2 className="text-lg font-semibold [font-family:inherit]">Edit product</h2>
        {field("name", "Name")}
        <div className="grid grid-cols-2 gap-3">
          {field("regular", "Price (Tk)", "Empty shows Stock Out")}
          {field("promo", "Sale price (Tk)", "Empty means no sale")}
        </div>
        {field("stock", "In stock", "Empty or 0 shows Stock Out")}
        <label className="block text-sm font-semibold">
          Availability
          <select className={input} value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
            <option value="">Not set</option>
            {[...AVAILABILITY, ...(base.availability && !AVAILABILITY.includes(base.availability) ? [base.availability] : [])].map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5" checked={form.show} onChange={(e) => setForm({ ...form, show: e.target.checked })} />
          Show on website
        </label>
        {error && <p role="alert" className="border-l-4 border-[#d63638] bg-[#fcf0f1] p-3 text-sm">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={secondary}>Cancel</button>
          <button type="submit" disabled={busy || !changed.length} className={primary}>{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </dialog>
  );
}
