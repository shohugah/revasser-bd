"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone, Printer } from "lucide-react";
import { dayLabel, orderDay, statusName, STATUSES, taka } from "@/lib/stats";
import { hasStockRecord, isClosed, MAX_MESSAGE, sheetStatus, stockChoice, type AdminOrder } from "@/lib/order-edit";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import { StatusBadge } from "./OrderList";

const box = "border border-[#c3c4c7] bg-white p-4 print:border-0 print:p-0";
const heading = "mb-2 text-base font-semibold [font-family:inherit]";
const button = "flex min-h-11 items-center gap-2 border border-[#2271b1] bg-white px-4 text-sm text-[#2271b1]";

export function OrderDetail({ start }: { start: AdminOrder }) {
  const router = useRouter();
  const [order, setOrder] = useState(start);
  const [status, setStatus] = useState(statusName(start.status));
  const [message, setMessage] = useState(start.message);
  const [answer, setAnswer] = useState<"" | "yes" | "no">("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  const day = orderDay(order);
  const mobile = toWhatsAppNumber(order.mobile);
  const statusChanged = status !== statusName(order.status);
  const choice = stockChoice(order, status);
  // Ask when the status changes, or offer it later for an order that is already closed.
  const asks = choice !== "" && (statusChanged || choice === "return");
  const stock = asks && answer === "yes" ? choice : "";
  const messageChanged = message.trim() !== order.message;
  const dirty = statusChanged || messageChanged || !!stock;
  const touch = () => { setError(""); setDone(""); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (asks && statusChanged && !answer) return setError(choice === "return" ? "Choose whether to put the stock back." : "Choose whether to take the stock again.");
    setBusy(true);
    touch();
    const changes = { ...(statusChanged ? { status: sheetStatus(status) } : {}), ...(messageChanged ? { message: message.trim() } : {}) };
    const expected = { status: order.status, message: order.message, stockReturned: order.stockReturned };
    try {
      const res = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNo: order.orderNo, expected, changes, stock }) });
      const reply = await res.json().catch(() => ({}));
      if (res.status === 401) return window.location.assign("/admin/login");
      if (reply.order) {
        setOrder(reply.order);
        setStatus(statusName(reply.order.status));
        setMessage(reply.order.message);
        setAnswer("");
      }
      if (!res.ok) return setError(reply.error || "The change was not saved.");
      const moved = (reply.moved as { id: string; from: number; to: number }[]).map((m) => `${m.id}: ${m.from} → ${m.to}`);
      setDone(["Saved.", moved.length ? `Stock updated (${moved.join(", ")}).` : "", reply.skipped.length ? `Stock not counted for: ${reply.skipped.join(", ")}.` : ""].filter(Boolean).join(" "));
      router.refresh();
    } catch {
      setError("No connection. Reload the page to see what the sheet holds.");
    } finally {
      setBusy(false);
    }
  }

  const money: [string, number][] = [["Subtotal", order.subtotal], ["Delivery", order.delivery], ...(order.discount ? ([[`Discount${order.coupon ? ` (${order.coupon})` : ""}`, -order.discount]] as [string, number][]) : [])];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="break-all text-2xl [font-family:inherit]">Order {order.orderNo}</h1>
        <span className="print:hidden"><StatusBadge status={order.status} /></span>
        <button onClick={() => window.print()} className={`${button} ml-auto print:hidden`}><Printer className="h-4 w-4" />Print packing slip</button>
      </div>
      <p className="mt-1 text-sm text-[#50575e]">{day ? `${dayLabel(day)} ${day.slice(0, 4)}` : ""}<span className="hidden print:inline"> · Revasser</span></p>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] print:block print:space-y-4">
        <div className="space-y-4">
          <section className={box}>
            <h2 className={heading}>Items</h2>
            <p className="whitespace-pre-line break-words text-sm">{order.items || "—"}</p>
            <dl className="mt-3 space-y-1 border-t border-[#dcdcde] pt-3 text-sm">
              {money.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd className="tabular-nums">{value < 0 ? `− ${taka(-value)}` : taka(value)}</dd></div>
              ))}
              <div className="flex justify-between gap-3 font-semibold"><dt>Total</dt><dd className="tabular-nums">{taka(order.total)}</dd></div>
            </dl>
            <p className="mt-3 break-words text-sm">Payment: {order.payment || "—"}</p>
          </section>
          <section className={box}>
            <h2 className={heading}>Customer</h2>
            <p className="break-words text-sm">{order.name}<br />{order.mobile}{order.email && <><br />{order.email}</>}</p>
            <p className="mt-2 break-words text-sm">{[order.address, order.area, order.district].filter(Boolean).join(", ")}</p>
            {order.note && <p className="mt-2 break-words text-sm"><strong>Customer note:</strong> {order.note}</p>}
            {mobile && (
              <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                <a href={`tel:+${mobile}`} className={button}><Phone className="h-4 w-4" />Call</a>
                <a href={`https://wa.me/${mobile}`} target="_blank" rel="noopener noreferrer" className={button}><MessageCircle className="h-4 w-4" />WhatsApp</a>
              </div>
            )}
          </section>
        </div>
        <form onSubmit={save} className={`${box} space-y-4 print:hidden`}>
          <label className="block text-sm font-semibold">
            Status
            <select className="mt-1 block min-h-11 w-full border border-[#8c8f94] bg-white px-3 text-base" value={status} onChange={(e) => { touch(); setStatus(e.target.value); setAnswer(""); }}>
              {[...STATUSES, ...(STATUSES.includes(status) ? [] : [status])].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          {asks && (
            <fieldset className="border-l-4 border-[#dba617] bg-[#fcf9e8] p-3 text-sm">
              <legend className="sr-only">Stock</legend>
              <p className="font-semibold">{choice === "return" ? "Put the stock back?" : "Take the stock again?"}</p>
              {([["yes", choice === "return" ? "Yes, add these pieces back to stock" : "Yes, lower the stock again"], ["no", "No, leave the stock as it is"]] as const).map(([v, label]) => (
                <label key={v} className="flex min-h-11 items-center gap-3">
                  <input type="radio" name="stock" className="h-5 w-5" checked={answer === v} onChange={() => { touch(); setAnswer(v); }} />
                  {label}
                </label>
              ))}
            </fieldset>
          )}
          {isClosed(status) && order.stockReturned && <p className="text-sm text-[#50575e]">The stock for this order has been put back.</p>}
          {isClosed(status) && !hasStockRecord(order) && <p className="text-sm text-[#50575e]">This order has no stock record (it is older, or its pieces were not counted). If needed, change stock on the Products screen.</p>}
          <label className="block text-sm font-semibold">
            Message for customer
            <textarea className="mt-1 block w-full border border-[#8c8f94] bg-white px-3 py-2 text-base" rows={3} maxLength={MAX_MESSAGE} value={message} onChange={(e) => { touch(); setMessage(e.target.value); }} />
            <span className="mt-1 block text-xs font-normal text-[#646970]">Shown on the Track Order page, for example the courier and delivery day.</span>
          </label>
          {error && <p role="alert" className="border-l-4 border-[#d63638] bg-[#fcf0f1] p-3 text-sm">{error}</p>}
          {done && <p role="status" className="border-l-4 border-[#00a32a] bg-[#edfaef] p-3 text-sm">{done}</p>}
          <button type="submit" disabled={busy || !dirty} className="min-h-11 bg-[#2271b1] px-5 text-sm text-white disabled:opacity-50">{busy ? "Saving…" : "Save changes"}</button>
        </form>
      </div>
    </>
  );
}
