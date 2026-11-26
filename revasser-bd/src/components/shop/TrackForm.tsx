"use client";

import { useEffect, useState } from "react";
import { toWhatsAppNumber } from "@/lib/whatsapp";

interface Found { orderNo: string; date?: string; status: string; statusText: string; items?: string; total?: string; message?: string }

export function TrackForm() {
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Found | null>(null);

  useEffect(() => setId(new URLSearchParams(window.location.search).get("ref") ?? ""), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!toWhatsAppNumber(phone)) return setError("Enter the Bangladeshi mobile number used for the order.");
    setBusy(true);
    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo: id.trim(), phone }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.orderNo) setResult(body);
      else setError(body.error || "We could not find that order.");
    } catch {
      setError("We could not check that just now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-6">
      <div>
        <label htmlFor="order-id" className="label text-muted">Order number</label>
        <input id="order-id" required maxLength={30} value={id} onChange={(e) => setId(e.target.value)} placeholder="R251127-7KQ2M" autoCapitalize="characters" className="field" />
      </div>
      <div>
        <label htmlFor="order-phone" className="label text-muted">Mobile number used</label>
        <input id="order-phone" required type="tel" inputMode="tel" maxLength={22} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="field" />
      </div>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      {result && (
        <div role="status" className="space-y-3 bg-soft p-6 text-sm">
          <p className="label text-muted">Order {result.orderNo}{result.date ? ` · ${result.date}` : ""}</p>
          <p className="font-serif text-2xl">{result.status}</p>
          <p>{result.statusText}</p>
          {result.message && <p className="border-l-2 border-accent pl-3">{result.message}</p>}
          {result.items && <p className="whitespace-pre-line text-muted">{result.items.replace(/ @ Tk \d+/g, "")}</p>}
          {result.total && <p>Total ৳{result.total}, Cash on Delivery</p>}
        </div>
      )}
      <button className="btn-dark w-full sm:w-auto" disabled={busy}>{busy ? "Checking…" : "Check status"}</button>
    </form>
  );
}
