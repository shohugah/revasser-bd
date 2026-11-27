import { SECTIONS } from "./sections";

export function Placeholder({ slug }: { slug: string }) {
  const s = SECTIONS.find((x) => x.slug === slug)!;
  return (
    <>
      <h1 className="text-2xl [font-family:inherit]">{s.name}</h1>
      <div className="mt-4 max-w-2xl border border-[#c3c4c7] bg-white p-5">
        <p>{s.about}</p>
        <p className="mt-2 text-sm text-[#50575e]">Coming in Stage {s.stage}. Nothing here reads or changes your shop data yet.</p>
      </div>
    </>
  );
}
