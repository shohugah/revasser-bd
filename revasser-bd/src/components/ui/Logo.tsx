// The natural size of each file, so the browser reserves space before it loads.
const SIZE = { lockup: [731, 140], stacked: [565, 390], wordmark: [559, 76], monogram: [464, 464] } as const;

type Tone = "ink" | "ivory" | "gold";

/** Always the logo files, never typed-out text. An uploaded logo replaces the dark version. */
export function Logo({ kind = "lockup", tone = "ink", uploaded = "", className = "" }: {
  kind?: "lockup" | "stacked" | "wordmark" | "monogram"; tone?: Tone; uploaded?: string; className?: string;
}) {
  const custom = uploaded && tone === "ink" && kind === "lockup";
  // Plain img: next/image adds nothing for SVG.
  const [width, height] = custom ? [undefined, undefined] : SIZE[kind];
  return <img width={width} height={height} src={custom ? uploaded : `/brand/logo/${kind}-${tone}.svg`} alt="Revasser" className={`object-contain ${className}`} />;
}
