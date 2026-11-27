"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Minus, Plus, Smartphone, Trash2, Truck } from "lucide-react";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import { taka } from "@/lib/format";
import { useStore, type Details } from "../StoreProvider";
import { Photo } from "../ui/Photo";
import { GoogleSignIn } from "./GoogleSignIn";

type Method = "cod" | "bkash" | "nagad";
const EMPTY: Details = { customerName: "", phone: "", email: "", area: "", address: "", location: "inside" };
const PHONE_ERROR = "Enter a Bangladeshi mobile number, like 01712345678.";
const box = "mt-1.5 block w-full rounded-md border border-ink/20 bg-white px-4 py-3 text-base outline-none transition-colors placeholder:text-muted/70 focus:border-ink aria-[invalid=true]:border-red-800";
const card = "rounded-xl border border-ink/10 bg-white/60 p-5 sm:p-7";
const heading = "font-serif text-xl";
const choice = "flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-ink/20 bg-white px-4 py-3 has-[:checked]:border-ink has-[:checked]:bg-soft";

export function CheckoutForm() {
  const { data, ready, lines, subtotal, addresses, recordOrder, setQuantity, open, user } = useStore();
  const c = data.checkout;

  const [form, setForm] = useState<Details>(EMPTY);
  const [tag, setTag] = useState("Home");
  const [newTag, setNewTag] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<Method>("cod");
  const [trxId, setTrxId] = useState("");
  const [trap, setTrap] = useState("");
  const [remember, setRemember] = useState(false);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ orderNo: string; total: number; phone: string; method: Method } | null>(null);
  const status = useRef<HTMLDivElement>(null);

  const pickAddress = (name: string) => {
    setTag(name);
    const found = addresses.find((a) => a.tag === name);
    setForm(found ? { ...EMPTY, ...found.details } : (f) => ({ ...f, area: "", address: "" }));
    setRemember(true);
  };

  useEffect(() => {
    if (ready && addresses[0]) pickAddress(addresses[0].tag);
    // Restore the latest saved address once, when storage has loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Fill in the name and email from Google, without overwriting anything already typed.
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, customerName: f.customerName || user.name, email: f.email || user.email }));
  }, [user, tag]);

  useEffect(() => {
    if (!placed) return;
    window.scrollTo(0, 0);
    status.current?.focus();
  }, [placed]);

  const items = lines.map((l) => ({ id: l.id, option: l.option, quantity: l.quantity }));
  const bagKey = JSON.stringify(items);

  async function applyCoupon(value: string) {
    setCouponError("");
    try {
      const res = await fetch("/api/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: value, items }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.discount > 0) setCoupon(body);
      else {
        setCoupon(null);
        setCouponError(body.error || "That code is not valid.");
      }
    } catch {
      setCoupon(null);
      setCouponError("We could not check that code just now.");
    }
  }

  // The discount depends on what is in the bag, so check it again whenever the bag changes.
  useEffect(() => {
    if (coupon && items.length) applyCoupon(coupon.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bagKey]);

  const fee = form.location === "inside" ? c.insideFee : c.outsideFee;
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const total = subtotal + fee - discount;
  const wallets = c.payNumber ? ([c.bkash && ["bkash", "bKash"], c.nagad && ["nagad", "Nagad"]].filter(Boolean) as [Method, string][]) : [];
  const wallet = wallets.find(([id]) => id === method)?.[1];
  const tags = Array.from(new Set(["Home", "Work", ...addresses.map((a) => a.tag), tag]));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const mobile = toWhatsAppNumber(form.phone);
    if (!mobile) {
      setPhoneError(PHONE_ERROR);
      (e.currentTarget.elements.namedItem("phone") as HTMLInputElement).focus();
      return;
    }
    const phone = `0${mobile.slice(3)}`;
    setPhoneError("");
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone, notes, website: trap, payment: method, trxId: wallet ? trxId : "", coupon: coupon?.code ?? "", items }),
      });
      const body = await res.json().catch(() => ({}));
      // Only an order number from the server means the order was saved.
      if (res.ok && typeof body.orderNo === "string") {
        recordOrder(
          {
            reference: body.orderNo,
            date: new Date().toISOString(),
            items: lines.map((l) => ({ name: l.product.name, option: l.option, quantity: l.quantity, price: l.product.price })),
            total: Number(body.total) || 0,
          },
          remember ? { tag, details: { ...form, phone } } : null,
        );
        setPlaced({ orderNo: body.orderNo, total: Number(body.total) || 0, phone, method });
      } else setError(body.error || "We could not place your order just now. Please try again in a minute.");
    } catch {
      setError("We could not reach the shop. Check your connection and try again. Your bag is still here.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <p role="status" className="py-24 text-muted">Opening your bag…</p>;

  if (placed)
    return (
      <div ref={status} tabIndex={-1} className="mx-auto max-w-xl py-16 text-center outline-none">
        <CheckCircle2 className="mx-auto h-12 w-12 text-accent" strokeWidth={1} />
        <h2 className="display-md mt-6">Thank you. Your order is placed.</h2>
        <p className="label mt-6">Order number</p>
        <p className="mt-2 select-all font-serif text-3xl tracking-wide">{placed.orderNo}</p>
        <p className="mt-6 text-muted">
          Total {taka(placed.total)}, {placed.method === "cod" ? "paid in cash when it arrives" : "we will check your payment"}. We will call you on {placed.phone} to confirm before we send it. Keep your order number to check its progress.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href={`/track-order?ref=${encodeURIComponent(placed.orderNo)}`} className="btn-dark">Track this order</Link>
          <Link href="/shop" className="btn-line">Continue shopping</Link>
        </div>
      </div>
    );

  if (!lines.length)
    return (
      <div className="py-20 text-center">
        <h2 className="display-md">{c.emptyBag}</h2>
        <Link href="/shop" className="btn-dark mt-8">Explore the edit</Link>
      </div>
    );

  const bind = (key: keyof Details) => ({
    id: key,
    name: key,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });
  const label = "text-sm text-muted";
  const addTag = () => {
    const name = (newTag ?? "").trim().slice(0, 20);
    if (name) pickAddress(name);
    setNewTag(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-8">
      <form id="checkout" onSubmit={submit} className={`${card} min-w-0 self-start`}>
        {c.googleClientId && (
          <div className="mb-6 border-b border-ink/10 pb-5">
            <GoogleSignIn hint="Optional: sign in to fill your details and keep your order history." />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={`${heading} mr-3`}>Address</h2>
          {tags.map((t) => (
            <button key={t} type="button" aria-pressed={tag === t} onClick={() => pickAddress(t)} className="min-h-10 rounded-md border border-ink/20 px-5 text-sm aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-page">{t}</button>
          ))}
          {newTag === null ? (
            <button type="button" aria-label="Add another address" onClick={() => setNewTag("")} className="flex h-10 w-10 items-center justify-center rounded-full bg-soft"><Plus className="h-4 w-4" /></button>
          ) : (
            <input autoFocus aria-label="Name this address" placeholder="Name it" value={newTag} maxLength={20} onChange={(e) => setNewTag(e.target.value)} onBlur={addTag} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} className="h-10 w-32 rounded-md border border-ink/30 bg-white px-3 text-sm" />
          )}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className={label}>Name<input {...bind("customerName")} required autoComplete="name" maxLength={80} className={box} /></label>
          <div>
            <label className={label}>Mobile No.
              <input {...bind("phone")} required type="tel" inputMode="tel" autoComplete="tel" maxLength={22} placeholder="01XXXXXXXXX" aria-invalid={!!phoneError}
                onBlur={() => setPhoneError(form.phone && !toWhatsAppNumber(form.phone) ? PHONE_ERROR : "")} className={box} />
            </label>
            {phoneError && <p role="alert" className="mt-1 text-sm text-red-800">{phoneError}</p>}
          </div>
          <label className={label}>Email (optional)<input {...bind("email")} type="email" autoComplete="email" maxLength={120} className={box} /></label>
          <label className={label}>City / Area<input {...bind("area")} required autoComplete="address-level2" maxLength={80} className={box} /></label>
          <label className={`${label} sm:col-span-2`}>Full address<input {...bind("address")} required autoComplete="street-address" maxLength={240} placeholder="House, road, block, flat" className={box} /></label>
          <label className={`${label} sm:col-span-2`}>Delivery note (optional)<textarea rows={2} maxLength={400} value={notes} onChange={(e) => setNotes(e.target.value)} className={box} /></label>
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-muted">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-[18px] w-[18px] accent-ink" />
          Save this address as “{tag}” on this device
        </label>

        <fieldset className="mt-8">
          <legend className={`${heading} mb-4`}>Delivery location</legend>
          <div className="grid gap-3">
            {([["inside", c.insideLabel, c.insideFee], ["outside", c.outsideLabel, c.outsideFee]] as const).map(([id, name, price]) => (
              <label key={id} className={choice}>
                <input type="radio" name="location" checked={form.location === id} onChange={() => setForm((f) => ({ ...f, location: id }))} className="h-[18px] w-[18px] accent-ink" />
                <Truck className="h-5 w-5" strokeWidth={1.25} />
                <span className="flex-1">{name} Delivery</span>
                <span>{taka(price)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className={`${heading} mb-4`}>Payment method</legend>
          <label className={choice}>
            <input type="radio" name="payment" checked={method === "cod"} onChange={() => setMethod("cod")} className="h-[18px] w-[18px] accent-ink" />
            <Truck className="h-5 w-5" strokeWidth={1.25} />
            <span className="flex-1"><span className="font-medium">Cash on Delivery</span><span className="block text-sm text-muted">Pay in cash when it arrives.</span></span>
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {wallets.map(([id, name]) => (
              <label key={id} className={choice}>
                <input type="radio" name="payment" checked={method === id} onChange={() => setMethod(id)} className="h-[18px] w-[18px] accent-ink" />
                <Smartphone className="h-5 w-5" strokeWidth={1.25} />{name}
              </label>
            ))}
            <label className="flex min-h-14 cursor-not-allowed items-center gap-3 rounded-md border border-dashed border-ink/20 px-4 py-3 text-muted">
              <input type="radio" disabled className="h-[18px] w-[18px]" />
              <CreditCard className="h-5 w-5" strokeWidth={1.25} /><span>Card<span className="block text-xs">Coming soon</span></span>
            </label>
          </div>
          {wallet && (
            <div className="mt-4 rounded-md bg-soft p-4 text-sm">
              <p>In your {wallet} app choose <strong>Send Money</strong>, send <strong>{taka(total)}</strong> to <strong className="select-all">{c.payNumber}</strong>, then type the Transaction ID here. We check it before shipping.</p>
              <label className="mt-3 block text-muted">Transaction ID<input required value={trxId} onChange={(e) => setTrxId(e.target.value)} minLength={6} maxLength={20} autoCapitalize="characters" className={box} /></label>
            </div>
          )}
        </fieldset>

        {/* Hidden from people; bots fill it in and their orders are refused. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">Leave this empty</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </div>
      </form>

      <aside aria-label="Order summary" className="min-w-0 self-start lg:sticky lg:top-36 lg:max-h-[calc(100svh-10rem)] lg:overflow-y-auto">
        <div className={card}>
          <p aria-live="polite"><span className="font-serif text-3xl">{taka(total)}</span> <span className="text-sm text-muted">Total</span></p>
          <h2 className={`${heading} mt-5`}>Items in the cart</h2>
          <ul className="mt-3 space-y-3">
            {lines.map(({ id, option, quantity, product: p }) => {
              const max = Math.min(20, p.stock ?? 20);
              return (
                <li key={id + option} className="flex items-center gap-3 rounded-md bg-soft p-2.5">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-page">
                    <Photo src={p.colours.find((k) => option.split(" / ").includes(k.name))?.image || p.images[0]} alt="" sizes="48px" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm leading-snug">{p.name}<span className="block text-xs text-muted">{option && `${option} · `}{taka((p.price ?? 0) * quantity)}</span></span>
                  <button type="button" aria-label={`One fewer ${p.name}`} disabled={quantity <= 1} onClick={() => setQuantity(id, option, quantity - 1)} className="flex h-9 w-7 items-center justify-center disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-5 text-center text-sm">{quantity}</span>
                  <button type="button" aria-label={`One more ${p.name}`} disabled={quantity >= max} onClick={() => setQuantity(id, option, quantity + 1)} className="flex h-9 w-7 items-center justify-center disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
                  <button type="button" aria-label={`Remove ${p.name}`} onClick={() => setQuantity(id, option, 0)} className="flex h-9 w-9 items-center justify-center rounded bg-white"><Trash2 className="h-4 w-4" strokeWidth={1.25} /></button>
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={() => open("search")} className="mt-3 flex min-h-11 items-center gap-2 text-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-soft"><Plus className="h-4 w-4" /></span>Add Item</button>

          <h2 className={`${heading} mt-4`}>Order details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Bag Total</dt><dd>{taka(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery Fee</dt><dd>{taka(fee)}</dd></div>
            <div className="flex justify-between"><dt>Discount{coupon && ` (${coupon.code})`}</dt><dd>{discount ? `− ${taka(discount)}` : taka(0)}</dd></div>
            <div className="flex justify-between border-t border-ink/15 pt-3 text-lg"><dt>Amount Payable</dt><dd>{taka(total)}</dd></div>
          </dl>

          <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) applyCoupon(code.trim()); }}>
            <input aria-label="Coupon code" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={30} className="min-w-0 flex-1 rounded-md border border-ink/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink" />
            <button className="rounded-md border border-ink px-5 text-sm">Apply</button>
          </form>
          {coupon && <p role="status" className="mt-2 text-sm text-green-800">You save {taka(discount)}. <button type="button" onClick={() => { setCoupon(null); setCode(""); }} className="underline">Remove</button></p>}
          {couponError && <p role="alert" className="mt-2 text-sm text-red-800">{couponError}</p>}
        </div>

        {error && <p role="alert" className="mt-3 rounded-md border border-red-800/30 p-4 text-sm text-red-800">{error}</p>}
        <button form="checkout" type="submit" disabled={busy} className="btn-dark mt-4 w-full rounded-md">{busy ? "Placing your order…" : c.confirmButton || "Place Order"}</button>
      </aside>
    </div>
  );
}
