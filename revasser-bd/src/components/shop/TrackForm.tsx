"use client";

import { useEffect, useState } from "react";
import { toWhatsAppNumber, whatsAppChatUrl } from "@/lib/whatsapp";
import { useStore } from "../StoreProvider";

export function TrackForm() {
  const { whatsapp } = useStore().data.checkout;
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ orderId: string; status: string; total: string } | null>(null);

  useEffect(() => setId(new URLSearchParams(window.location.search).get("ref") ?? ""), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    const mobile = toWhatsAppNumber(phone);
    if (!mobile) return setError("Enter the Bangladeshi mobile number used for the order.");
    if (whatsapp) {
      const text = `Hello Revasser, could I have an update on order ${id.trim()}? Mobile used: 0${mobile.slice(3)}`;
      window.open(whatsAppChatUrl(whatsapp, text), "_blank", "noopener,noreferrer");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/track-order?orderId=${encodeURIComponent(id)}&phone=${encodeURIComponent(phone)}`);
      const body = await res.json();
      if (res.ok) setResult(body);
      else setError(body.error || "Could not find that order.");
    } catch {
      setError("We could not check that just now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-6">
      <div>
        <label htmlFor="order-id" className="label text-muted">Order reference</label>
        <input id="order-id" required maxLength={40} value={id} onChange={(e) => setId(e.target.value)} className="field" />
      </div>
      <div>
        <label htmlFor="order-phone" className="label text-muted">Mobile number used</label>
        <input id="order-phone" required type="tel" maxLength={22} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="field" />
      </div>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      {result && <p role="status" className="bg-soft p-5 text-sm">Order #{result.orderId}: {result.status}. Total ৳{result.total}</p>}
      <button className="btn-dark w-full sm:w-auto" disabled={busy}>{busy ? "Checking…" : whatsapp ? "Ask on WhatsApp" : "Check status"}</button>
    </form>
  );
}
