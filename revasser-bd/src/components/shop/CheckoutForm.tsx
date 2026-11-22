"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { toWhatsAppNumber, whatsAppOrderUrl } from "@/lib/whatsapp";
import { taka } from "@/lib/format";
import { useStore, type Details } from "../StoreProvider";
import { Photo } from "../ui/Photo";

const PAYMENT = { cod: "Cash on Delivery", bkash: "bKash", nagad: "Nagad" };
type Method = keyof typeof PAYMENT;

function newReference() {
  const day = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(4, "0").slice(-4);
  return `R${day}-${random}`;
}

export function CheckoutForm() {
  const { data, ready, lines, subtotal, hasUnpriced, details, recordOrder, markSent, clearBag } = useStore();
  const c = data.checkout;
  const methods = (Object.keys(PAYMENT) as Method[]).filter((m) => c[m]);

  const [form, setForm] = useState<Details>({ customerName: "", phone: "", email: "", district: c.districts[0] ?? "", area: "", address: "" });
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<Method | "">(methods[0] ?? "");
  const [trxId, setTrxId] = useState("");
  const [remember, setRemember] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [waUrl, setWaUrl] = useState("");
  const [sent, setSent] = useState(false);
  const [placed, setPlaced] = useState("");
  const reference = useRef("");
  const status = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || !details) return;
    setForm((f) => ({ ...f, ...details, district: c.districts.includes(details.district) ? details.district : f.district }));
    setRemember(true);
    // Restore saved details once, when storage has loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!waUrl && !sent && !placed) return;
    window.scrollTo(0, 0);
    status.current?.focus();
  }, [waUrl, sent, placed]);

  const inside = form.district === c.insideDistrict;
  const fee = inside ? c.insideFee : c.outsideFee;
  const feeLabel = inside ? c.insideLabel : c.outsideLabel;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const mobile = toWhatsAppNumber(form.phone);
    if (!mobile) {
      setPhoneError("Enter a Bangladeshi mobile number, like 01712345678.");
      (e.currentTarget.elements.namedItem("phone") as HTMLInputElement).focus();
      return;
    }
    const phone = `0${mobile.slice(3)}`;
    setPhoneError("");
    setFailed(false);
    const transaction = method === "bkash" || method === "nagad" ? trxId : "";

    if (c.whatsapp) {
      reference.current ||= newReference();
      const items = lines.map((l) => ({ name: l.product.name, option: l.option, quantity: l.quantity, price: l.product.price }));
      const url = whatsAppOrderUrl(c.whatsapp, {
        ...form,
        phone,
        notes: notes.trim(),
        storeName: data.store.name.toUpperCase(),
        reference: reference.current,
        items,
        deliveryFee: fee,
        deliveryLabel: feeLabel,
        payment: method ? PAYMENT[method] : "To be confirmed",
        trxId: transaction,
      });
      recordOrder({ reference: reference.current, date: new Date().toISOString(), items, url, sent: false }, remember ? { ...form, phone } : null);
      setWaUrl(url);
      // Must run inside the tap, before any await, or phones block it as a pop-up.
      window.open(url, "_blank", "noopener,noreferrer");
      // We cannot know whether they pressed Send, so never claim the order was placed or empty the bag.
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone,
          notes: [notes, ...lines.filter((l) => l.option).map((l) => `${l.product.name}: ${l.option}`)].filter(Boolean).join("\n"),
          paymentMethod: method,
          trxId: transaction,
          items: lines.map((l) => ({ id: l.id, quantity: l.quantity })),
        }),
      });
      const body = await res.json();
      // Only a real order number from the server counts as a placed order.
      if (res.ok && body.orderNumber) {
        setPlaced(`#${body.orderNumber}`);
        clearBag();
      } else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <p role="status" className="py-24 text-muted">Opening your bag…</p>;

  if (placed || sent)
    return (
      <div ref={status} tabIndex={-1} className="mx-auto max-w-xl py-16 text-center outline-none">
        <CheckCircle2 className="mx-auto h-12 w-12 text-accent" strokeWidth={1} />
        <h2 className="display-md mt-6">{placed ? "Order placed." : "Now over to us."}</h2>
        <p className="mt-4 text-muted">
          {placed
            ? `Your order number is ${placed}.`
            : `Once your message reaches us, we will reply on WhatsApp to confirm availability and the total. Your reference is ${reference.current}. It is not confirmed until we reply.`}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/shop" className="btn-dark">Continue shopping</Link>
          {sent && <Link href="/account" className="btn-line">View on this device</Link>}
        </div>
      </div>
    );

  if (waUrl)
    return (
      <div ref={status} tabIndex={-1} role="status" className="mx-auto max-w-xl py-16 text-center outline-none">
        <MessageCircle className="mx-auto h-12 w-12 text-accent" strokeWidth={1} />
        <h2 className="display-md mt-6">One last step.</h2>
        <p className="mt-4 text-muted">
          Press <strong className="font-medium text-ink">Send</strong> in WhatsApp. Your order reaches us only after you send that
          message, and is confirmed when we reply.
        </p>
        <p className="label mt-6">Reference {reference.current}</p>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-dark mt-8 w-full">Open WhatsApp again</a>
        <button
          className="btn-line mt-2 w-full"
          onClick={() => {
            markSent(reference.current);
            setSent(true);
            setWaUrl("");
          }}
        >
          I pressed Send, clear my bag
        </button>
        <p className="mt-6 text-sm text-muted">
          WhatsApp not opening? Message us at <span className="select-all text-ink">+{c.whatsapp}</span>
        </p>
        <button onClick={() => setWaUrl("")} className="mt-2 min-h-11 text-sm underline underline-offset-4">Change my details</button>
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
          {methods.length === 0 && <p className="text-muted">We will confirm payment with you on WhatsApp.</p>}
          {methods.map((m) => (
            <label key={m} className="flex min-h-14 cursor-pointer items-center gap-3 border-b border-ink/10">
              <input type="radio" name="payment" checked={method === m} onChange={() => setMethod(m)} className="h-[18px] w-[18px] accent-ink" />
              {PAYMENT[m]}
            </label>
          ))}
          {(method === "bkash" || method === "nagad") && (
            <div className="mt-5 bg-soft p-5 text-sm">
              {hasUnpriced ? (
                <p>Do not send money yet. We will confirm your total and payment details on WhatsApp first.</p>
              ) : (
                <>
                  <p>Send <strong>{taka(subtotal + fee)}</strong> {c.paymentText}</p>
                  <label htmlFor="trx" className="label mt-5 block text-muted">Transaction ID</label>
                  <input id="trx" required value={trxId} onChange={(e) => setTrxId(e.target.value)} maxLength={40} className="field" />
                </>
              )}
            </div>
          )}
        </fieldset>

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
              <span className="shrink-0 text-right text-sm">{l.product.price === null ? "To confirm" : taka(l.product.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-ink/15 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{hasUnpriced ? "To confirm" : taka(subtotal)}</dd></div>
          <div className="flex justify-between gap-3"><dt>Delivery ({feeLabel})</dt><dd>{taka(fee)}</dd></div>
          <div className="flex justify-between border-t border-ink/15 pt-3 text-lg">
            <dt>Total</dt><dd>{hasUnpriced ? "Confirmed on WhatsApp" : taka(subtotal + fee)}</dd>
          </div>
        </dl>
        {failed && (
          <div role="alert" className="mt-5 border border-red-800/30 p-4 text-sm text-red-800">
            <p className="font-medium">We could not confirm your order.</p>
            <p>Please do not send any payment. If you already sent money, do not send it again and keep your Transaction ID. Your bag has not been cleared.</p>
          </div>
        )}
        <button form="checkout" type="submit" disabled={busy} className="btn-dark mt-6 w-full">
          {busy ? "Sending your order…" : c.whatsapp ? c.whatsappButton : c.confirmButton || "Confirm order"}
        </button>
        {c.whatsapp && <p className="mt-3 text-xs text-muted">Opens WhatsApp with your order written out. Nothing is final until we reply.</p>}
      </aside>
    </div>
  );
}
