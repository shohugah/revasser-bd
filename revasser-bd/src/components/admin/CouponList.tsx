"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { couponProblem, NEW_CODE, type Coupon, type CouponValues } from "@/lib/coupon-edit";
import { taka } from "@/lib/stats";

const input = "mt-1 min-h-11 w-full border border-[#8c8f94] bg-white px-3 text-base";
const primary = "min-h-11 border border-[#2271b1] bg-[#2271b1] px-4 text-sm text-white disabled:opacity-50";
const secondary = "min-h-11 border border-[#2271b1] bg-white px-4 text-sm text-[#2271b1] disabled:opacity-50";

const describe = (c: Coupon) =>
  `${c.type === "percent" ? `${c.value}% off` : c.type === "taka" ? `${taka(c.value)} off` : "Type not set"} · ${c.minimum > 0 ? `orders from ${taka(c.minimum)}` : "no minimum"}`;
const values = ({ type, value, minimum, active }: Coupon): CouponValues => ({ type, value, minimum, active });

type Reply = { error?: string; coupon?: Coupon };

async function send(code: string, expected: CouponValues | null, next: CouponValues): Promise<{ ok: boolean; reply: Reply }> {
  try {
    const res = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, expected, next }) });
    if (res.status === 401) window.location.assign("/admin/login");
    return { ok: res.ok, reply: await res.json().catch(() => ({})) };
  } catch {
    return { ok: false, reply: { error: "No connection. Reload the page to see what the sheet holds." } };
  }
}

/** The form for a new code, or for changing one. */
function CouponForm({ coupon, onSaved, onCancel }: { coupon: Coupon | null; onSaved: (c: Coupon, message: string) => void; onCancel: () => void }) {
  // What the sheet held when editing began, updated if the sheet turns out to have changed.
  const [base, setBase] = useState(coupon);
  const [code, setCode] = useState(coupon?.code ?? "");
  const [type, setType] = useState(coupon?.type === "taka" ? "taka" : "percent");
  const [value, setValue] = useState(coupon?.value ? String(coupon.value) : "");
  const [minimum, setMinimum] = useState(coupon?.minimum ? String(coupon.minimum) : "");
  const [active, setActive] = useState(coupon?.active ?? true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const wanted = code.trim().toUpperCase();
    const next: CouponValues = { type, value: Number(value.trim() || NaN), minimum: Number(minimum.trim() || 0), active };
    if (!coupon && !NEW_CODE.test(wanted)) return setError("A code is 2 to 30 letters or numbers, starting with a letter. No spaces.");
    const problem = couponProblem(next);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    const { ok, reply } = await send(wanted, base ? values(base) : null, next);
    setBusy(false);
    if (ok && reply.coupon) return onSaved(reply.coupon, `Saved ${reply.coupon.code}.`);
    if (base && reply.coupon) {
      setBase(reply.coupon);
      setType(reply.coupon.type === "taka" ? "taka" : "percent");
      setValue(String(reply.coupon.value));
      setMinimum(reply.coupon.minimum ? String(reply.coupon.minimum) : "");
      setActive(reply.coupon.active);
    }
    setError(reply.error || "The change was not saved.");
  }

  const change = <T,>(set: (v: T) => void) => (v: T) => { set(v); setError(""); };
  return (
    <form onSubmit={save} noValidate className="grid gap-3 border border-[#c3c4c7] bg-white p-4 sm:grid-cols-2">
      <h2 className="text-base font-semibold [font-family:inherit] sm:col-span-2">{coupon ? `Edit ${coupon.code}` : "New coupon"}</h2>
      {!coupon && (
        <label className="text-sm sm:col-span-2">Code
          <input value={code} onChange={(e) => change(setCode)(e.target.value.toUpperCase())} maxLength={30} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="EID10" className={input} />
        </label>
      )}
      <label className="text-sm">Discount type
        <select value={type} onChange={(e) => change(setType)(e.target.value)} className={input}>
          <option value="percent">Percent off</option>
          <option value="taka">Taka off</option>
        </select>
      </label>
      <label className="text-sm">{type === "percent" ? "Percent" : "Amount in taka"}
        <input value={value} onChange={(e) => change(setValue)(e.target.value)} inputMode="numeric" className={input} />
      </label>
      <label className="text-sm">Minimum order in taka (optional)
        <input value={minimum} onChange={(e) => change(setMinimum)(e.target.value)} inputMode="numeric" placeholder="0" className={input} />
      </label>
      <label className="flex min-h-11 items-center gap-2 self-end text-sm">
        <input type="checkbox" checked={active} onChange={(e) => change(setActive)(e.target.checked)} className="h-5 w-5" />
        Customers can use this code
      </label>
      {error && <p role="alert" className="text-sm text-[#b32d2e] sm:col-span-2">{error}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={busy} className={primary}>{busy ? "Saving…" : "Save coupon"}</button>
        <button type="button" disabled={busy} onClick={onCancel} className={secondary}>Cancel</button>
      </div>
    </form>
  );
}

export function CouponList({ start, used }: { start: Coupon[]; used: Record<string, number> | null }) {
  const router = useRouter();
  const [list, setList] = useState(start);
  // "" is the new-coupon form, a code is that coupon's form, null is closed.
  const [open, setOpen] = useState<string | null>(null);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const put = (c: Coupon) => setList((old) => (old.some((x) => x.code === c.code) ? old.map((x) => (x.code === c.code ? c : x)) : [...old, c]));
  const show = (next: string | null) => { setOpen(next); setDone(""); setError(""); };
  const saved = (c: Coupon, message: string) => { put(c); setOpen(null); setDone(message); router.refresh(); };

  async function flip(c: Coupon) {
    setBusy(c.code);
    setDone("");
    setError("");
    const { ok, reply } = await send(c.code, values(c), { ...values(c), active: !c.active });
    setBusy("");
    if (reply.coupon) put(reply.coupon);
    if (ok && reply.coupon) return saved(reply.coupon, `${c.code} is now ${reply.coupon.active ? "on" : "off"}.`);
    setError(reply.error || "The change was not saved.");
  }

  return (
    <div className="max-w-3xl">
      {open === "" ? (
        <div className="mt-4"><CouponForm coupon={null} onSaved={saved} onCancel={() => show(null)} /></div>
      ) : (
        <button onClick={() => show("")} className={`mt-4 ${primary}`}>Add coupon</button>
      )}
      <p role="status" className={done ? "mt-3 border border-[#c3c4c7] border-l-4 border-l-[#00a32a] bg-white p-3 text-sm" : "sr-only"}>{done}</p>
      {error && <p role="alert" className="mt-3 border border-[#c3c4c7] border-l-4 border-l-[#d63638] bg-white p-3 text-sm">{error}</p>}
      <ul className="mt-3 divide-y divide-[#dcdcde] border border-[#c3c4c7] bg-white">
        {list.map((c, i) => (
          <li key={`${c.code}-${i}`}>
            {open === c.code ? (
              <CouponForm coupon={c} onSaved={saved} onCancel={() => show(null)} />
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
                <span className="min-w-0 flex-1 basis-52">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="break-all font-semibold">{c.code}</span>
                    <span className={`px-2 py-0.5 text-xs ${c.active ? "bg-[#edfaef] text-[#007017]" : "bg-[#f0f0f1] text-[#50575e]"}`}>{c.active ? "On" : "Off"}</span>
                  </span>
                  <span className="mt-1 block text-sm text-[#50575e]">
                    {describe(c)}
                    {used && ` · used in ${used[c.code] ?? 0} ${used[c.code] === 1 ? "order" : "orders"}`}
                  </span>
                  {couponProblem(c) && <span className="mt-1 block text-sm text-[#b32d2e]">Please check this code and edit it: {couponProblem(c)}</span>}
                </span>
                <button onClick={() => show(c.code)} aria-label={`Edit ${c.code}`} className={secondary}>Edit</button>
                <button onClick={() => flip(c)} disabled={!!busy || (!c.active && !!couponProblem(c))} aria-label={`Switch ${c.active ? "off" : "on"} ${c.code}`} className={secondary}>
                  {busy === c.code ? "Saving…" : c.active ? "Switch off" : "Switch on"}
                </button>
              </div>
            )}
          </li>
        ))}
        {!list.length && <li className="p-4 text-sm text-[#646970]">No coupons yet. Use Add coupon to make your first code.</li>}
      </ul>
      <p className="mt-3 text-sm text-[#646970]">Changes work on the shop straight away. Codes are never deleted; switch off the ones you no longer want.</p>
    </div>
  );
}
