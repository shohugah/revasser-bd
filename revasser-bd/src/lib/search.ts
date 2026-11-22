import type { Product } from "./types";

/** Every word typed must appear somewhere. Simple plurals ("rings") find the singular. */
export function matches(p: Product, query: string) {
  const text = `${p.name} ${p.categoryName} ${p.description} ${p.colours.map((c) => c.name).join(" ")}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => text.includes(word) || (word.length > 3 && word.endsWith("s") && text.includes(word.slice(0, -1))));
}
