// The Revasser logo, cut from the brand's own Facebook artwork. Always an image, never typed-out text.
export function Logo({ tone = "ink", uploaded = "", className = "" }: { tone?: "ink" | "ivory"; uploaded?: string; className?: string }) {
  const custom = uploaded && tone === "ink";
  // Plain img: the files are small and used on every page. Sizes reserve space before they load.
  return <img width={custom ? undefined : 1310} height={custom ? undefined : 240} src={custom ? uploaded : `/brand/logo/lockup-${tone}.png`} alt="Revasser" className={`object-contain ${className}`} />;
}
