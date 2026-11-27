import { dayLabel, taka } from "@/lib/stats";

// Plain server-drawn charts in one colour. Every value is also readable as text.
const BAR = "#2a78d6";

export function Box({ title, note, children, className = "" }: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 border border-[#c3c4c7] bg-white ${className}`}>
      <h2 className="border-b border-[#dcdcde] px-4 py-3 text-base font-semibold [font-family:inherit]">{title}</h2>
      <div className="p-4">
        {children}
        {note && <p className="mt-3 text-xs text-[#646970]">{note}</p>}
      </div>
    </section>
  );
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0 border border-[#c3c4c7] bg-white p-4">
      <p className="text-sm text-[#50575e]">{label}</p>
      <p className="mt-1 break-words text-2xl font-semibold">{value}</p>
      {note && <p className="mt-1 text-xs text-[#646970]">{note}</p>}
    </div>
  );
}

export function Problem({ text }: { text: string }) {
  return (
    <div role="alert" className="mt-4 max-w-2xl border border-[#c3c4c7] border-l-4 border-l-[#dba617] bg-white p-4">
      {text}
    </div>
  );
}

export const Empty = ({ text }: { text: string }) => <p className="text-sm text-[#646970]">{text}</p>;

export function BarList({ rows, unit, empty }: { rows: { label: string; value: number; extra?: string }[]; unit: string; empty: string }) {
  if (!rows.some((r) => r.value > 0)) return <Empty text={empty} />;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 break-words">{r.label}</span>
            <span className="shrink-0 tabular-nums text-[#50575e]">
              {r.value} {unit}
              {r.value === 1 ? "" : "s"}
              {r.extra ? ` · ${r.extra}` : ""}
            </span>
          </div>
          <div aria-hidden="true" className="mt-1 h-2">
            <div className="h-2 rounded-r" style={{ width: `${(r.value / max) * 100}%`, background: BAR }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A round number at or above the largest value, for the top of the scale. */
function niceTop(max: number) {
  if (max <= 0) return 1000;
  const step = 10 ** Math.floor(Math.log10(max));
  return [1, 2, 4, 5, 10].map((m) => m * step).find((v) => v >= max)!;
}
const short = (n: number) => (n >= 10_000 ? `${n / 1000}K` : n.toLocaleString("en-US"));

export function SalesChart({ series }: { series: { key: string; sales: number; orders: number }[] }) {
  const max = Math.max(0, ...series.map((s) => s.sales));
  if (!max) return <Empty text="No sales in this period yet." />;
  const top = niceTop(max);
  const every = Math.ceil(series.length / 6);
  const describe = (s: (typeof series)[number]) => `${dayLabel(s.key)}: ${taka(s.sales)}, ${s.orders} order${s.orders === 1 ? "" : "s"}`;
  return (
    <>
      <div className="flex gap-2 pt-2">
        <div aria-hidden="true" className="flex h-48 w-10 shrink-0 flex-col justify-between text-right text-xs tabular-nums text-[#898781]">
          {[top, top / 2, 0].map((v) => (
            <span key={v} className="-my-2">{short(v)}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-48">
            {[0, 50].map((t) => (
              <div key={t} aria-hidden="true" className="absolute inset-x-0 border-t border-[#e1e0d9]" style={{ top: `${t}%` }} />
            ))}
            <ol className={`absolute inset-0 flex items-end border-b border-[#c3c2b7] ${series.length > 45 ? "gap-px" : "gap-0.5"}`}>
              {series.map((s, i) => (
                <li key={s.key} tabIndex={0} aria-label={describe(s)} className="group relative flex h-full min-w-0 flex-1 items-end justify-center hover:bg-black/5 focus-visible:bg-black/5">
                  <span className="block w-full max-w-6 rounded-t" style={{ height: `${(s.sales / top) * 100}%`, minHeight: s.sales ? 2 : 0, background: BAR }} />
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute top-0 z-10 hidden whitespace-nowrap border border-[#c3c4c7] bg-white px-2 py-1 text-xs shadow group-hover:block group-focus:block ${i < series.length / 3 ? "left-0" : i > (series.length * 2) / 3 ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                  >
                    {describe(s)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div aria-hidden="true" className="relative mt-1 h-4 text-xs text-[#898781]">
            {series.map((s, i) =>
              (series.length - 1 - i) % every === 0 ? (
                <span key={s.key} className={`absolute whitespace-nowrap ${i === series.length - 1 ? "-translate-x-full" : i === 0 ? "" : "-translate-x-1/2"} ${((series.length - 1 - i) / every) % 2 ? "hidden sm:block" : ""}`} style={{ left: `${((i + (i === series.length - 1 ? 1 : i === 0 ? 0 : 0.5)) / series.length) * 100}%` }}>
                  {dayLabel(s.key)}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-[#2271b1]">Show as a table</summary>
        <div className="mt-2 max-h-72 overflow-auto">
          <table className="w-full text-left tabular-nums">
            <thead>
              <tr className="border-b border-[#c3c4c7]"><th className="py-1 font-semibold">Date</th><th className="py-1 text-right font-semibold">Orders</th><th className="py-1 text-right font-semibold">Sales</th></tr>
            </thead>
            <tbody>
              {[...series].reverse().map((s) => (
                <tr key={s.key} className="border-b border-[#f0f0f1]"><td className="py-1">{dayLabel(s.key)}</td><td className="py-1 text-right">{s.orders}</td><td className="py-1 text-right">{taka(s.sales)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
