"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { useStore } from "../StoreProvider";

export function Purchase({ product: p, compact, onColour }: { product: Product; compact?: boolean; onColour?: (image: string) => void }) {
  const { add, data, isWished, toggleWish } = useStore();
  const [colour, setColour] = useState(p.colours.length === 1 ? p.colours[0].name : "");
  const [size, setSize] = useState(p.sizes.length === 1 ? p.sizes[0] : "");
  const [error, setError] = useState("");
  const soldOut = p.availability === "Sold out";
  const unpriced = p.price === null;
  const wished = isWished(p.id);

  const groups = [
    { name: "Colour", values: p.colours.map((c) => c.name), value: colour, set: setColour },
    { name: "Size", values: p.sizes, value: size, set: setSize },
  ].filter((g) => g.values.length > 0);

  function submit() {
    const missing = groups.find((g) => !g.value);
    if (missing) return setError(`Choose a ${missing.name.toLowerCase()} first.`);
    setError("");
    add(p.id, [colour, size].filter(Boolean).join(" / "));
  }

  return (
    <div className={compact ? "mt-5" : "mt-8"}>
      {groups.map((g) => (
        <fieldset key={g.name} className="mb-6">
          <legend className="label mb-3 text-muted">{g.name}{g.value && <span className="text-ink">: {g.value}</span>}</legend>
          <div className="flex flex-wrap gap-2">
            {g.values.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={g.value === v}
                onClick={() => {
                  g.set(v);
                  setError("");
                  const image = g.name === "Colour" && p.colours.find((c) => c.name === v)?.image;
                  if (image) onColour?.(image);
                }}
                className="min-h-11 min-w-11 border border-ink/25 px-4 text-sm transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-page"
              >
                {v}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {error && <p role="alert" className="mb-3 text-sm text-red-800">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={soldOut || unpriced} className="btn-dark flex-1">
          {soldOut ? "Sold out" : unpriced ? data.labels.priceOnRequest : data.labels.addButton || "Add to bag"}
        </button>
        <button onClick={() => toggleWish(p)} aria-pressed={wished} aria-label={`Save ${p.name} to wishlist`} className="btn-line w-14 shrink-0 px-0">
          <Heart className={`h-[18px] w-[18px] ${wished ? "fill-current" : ""}`} strokeWidth={1.25} />
        </button>
      </div>
    </div>
  );
}
