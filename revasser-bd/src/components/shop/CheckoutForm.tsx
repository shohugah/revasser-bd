"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Truck } from "lucide-react";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import { taka } from "@/lib/format";
import { useStore, type Details } from "../StoreProvider";
import { Photo } from "../ui/Photo";

export function CheckoutForm() {
  const { data, ready, lines, subtotal, hasUnpriced, details, recordOrder } = useStore();
  const c = data.checkout;

  const [form, setForm] = useState<Details>({ customerName: "", phone: "", email: "", district: c.districts[0] ?? "", area: "", address: "" });
  const [notes, setNotes] = useState("");
  const [trap, setTrap] = useState("");
  const [remember, setRemember] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ orderNo: string; total: number; phone: string } | null>(null);
  const status = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || !details) return;
    setForm((f) => ({ ...f, ...details, district: c.districts.includes(details.district) ? details.district : f.district }));
    setRemember(true);
    // Restore saved details once, when storage has loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!placed) return;
    window.scrollTo(0, 0);
    status.current?.focus();
  }, [placed]);

  const inside = form.district === c.insideDistrict;
  const fee = inside ? c.insideFee : c.outsideFee;
  const feeLabel = inside ? c.insideLabel : c.outsideLabel;
  const blocked = hasUnpriced || lines.some((l) => l.product.availability === "Sold out");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || blocked) return;
    const mobile = toWhatsAppNumber(form.phone);
    if (!mobile) {
      setPhoneError("Enter a Bangladeshi mobile number, like 01712345678.");
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
        body: JSON.stringify({
          ...form,
          phone,
          notes,
          website: trap,
          items: lines.map((l) => ({ id: l.id, option: l.option, quantity: l.quantity })),
        }),
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
          remember ? { ...form, phone } : null,
        );
        setPlaced({ orderNo: body.orderNo, total: Number(body.total) || 0, phone });
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
          Total {taka(placed.total)}, paid in cash when it arrives. We will call you on {placed.phone} to confirm before we send it.
          Keep your order number to check its progress.
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
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });
  const legend = "mb-6 font-serif text-2xl";

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-20">
      <form id="checkout" onSubmit={submit} className="min-w-0 space-y-12">
        <fieldset>
          <legend className={legend}>Your details</legend>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="customerName" className="label text-muted">Full name</label>
              <input {...bind("customerName")} required autoComplete="name" maxLength={80} className="field" />
            </div>
            <div>
              <label htmlFor="phone" className="label text-muted">Mobile number</label>
              <input
                {...bind("phone")}
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={22}
                placeholder="01XXXXXXXXX"
                aria-invalid={!!phoneError}
                aria-describedby={phoneError ? "phone-error" : undefined}
                onBlur={() => setPhoneError(form.phone && !toWhatsAppNumber(form.phone) ? "Enter a Bangladeshi mobile number, like 01712345678." : "")}
                className="field"
              />
              {phoneError && <p id="phone-error" role="alert" className="mt-2 text-sm text-red-800">{phoneError}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="email" className="label text-muted">Email (optional)</label>
              <input {...bind("email")} type="email" autoComplete="email" maxLength={120} className="field" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className={legend}>Delivery</legend>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="district" className="label text-muted">District</label>
              <select {...bind("district")} required className="field h-[50px]">
                {c.districts.map((d) => <option key={d}>{d}</option>)}
              </select>
              <p className="mt-2 text-sm text-muted">{feeLabel}: {taka(fee)}</p>
            </div>
            <div>
              <label htmlFor="area" className="label text-muted">Area / thana</label>
              <input {...bind("area")} required autoComplete="address-level3" maxLength={80} className="field" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className="label text-muted">Full address</label>
              <input {...bind("address")} required autoComplete="street-address" maxLength={240} placeholder="House, road, block, flat" className="field" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="label text-muted">Size or delivery note (optional)</label>
              <textarea id="notes" name="notes" rows={2} maxLength={400} value={notes} onChange={(e) => setNotes(e.target.value)} className="field" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className={legend}>Payment</legend>
          <div className="flex items-start gap-4 border border-ink/15 p-5">
            <Truck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.25} />
            <div>
              <p>Cash on Delivery</p>
              <p className="mt-1 text-sm text-muted">Pay in cash when your order arrives. We call to confirm every order before we send it.</p>
            </div>
          </div>
        </fieldset>

        {/* Hidden from people; bots fill it in and their orders are refused. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">Leave this empty</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-ink" />
          Remember these details on this device for next time
        </label>
      </form>

      <aside aria-label="Order summary" className="min-w-0 self-start bg-soft p-6 sm:p-8 lg:sticky lg:top-40">
        <h2 className="text-2xl">Your order</h2>
        <ul className="mt-5 divide-y divide-ink/10">
          {lines.map((l) => (
            <li key={l.id + l.option} className="flex gap-4 py-4">
              <span className="relative h-16 w-16 shrink-0 overflow-hidden bg-page">
                <Photo src={l.product.colours.find((k) => l.option.split(" / ").includes(k.name))?.image || l.product.images[0]} alt="" sizes="64px" />
              </span>
              <span className="min-w-0 flex-1 text-sm leading-snug">
                {l.product.name}
                <span className="block text-muted">{l.option && `${l.option}, `}Qty {l.quantity}</span>
              </span>
              <span className="shrink-0 text-right text-sm">
                {l.product.price === null ? (
                  <span className="text-red-800">{data.labels.priceOnRequest}</span>
                ) : l.product.availability === "Sold out" ? (
                  <span className="text-red-800">Sold out</span>
                ) : (
                  taka(l.product.price * l.quantity)
                )}
              </span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-ink/15 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{blocked ? "—" : taka(subtotal)}</dd></div>
          <div className="flex justify-between gap-3"><dt>Delivery ({feeLabel})</dt><dd>{taka(fee)}</dd></div>
          <div className="flex justify-between border-t border-ink/15 pt-3 text-lg">
            <dt>Total</dt><dd>{blocked ? "—" : taka(subtotal + fee)}</dd>
          </div>
        </dl>
        {blocked && (
          <p role="alert" className="mt-5 border border-red-800/30 p-4 text-sm text-red-800">
            Some pieces in your bag cannot be ordered yet. Remove the ones marked in red from your bag to continue.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-5 border border-red-800/30 p-4 text-sm text-red-800">
            {error}
          </p>
        )}
        <button form="checkout" type="submit" disabled={busy || blocked} className="btn-dark mt-6 w-full">
          {busy ? "Placing your order…" : `${c.confirmButton || "Place order"}${blocked ? "" : ` · ${taka(subtotal + fee)}`}`}
        </button>
        <p className="mt-3 text-xs text-muted">Cash on Delivery. You pay nothing now.</p>
      </aside>
    </div>
  );
}
