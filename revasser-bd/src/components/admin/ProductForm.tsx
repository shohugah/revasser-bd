"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { draftProblem, MAX_PHOTO_BYTES, MAX_PHOTOS, MAX_REQUEST_BYTES, type ProductDraft } from "@/lib/catalog-edit";

const input = "mt-1 block w-full border border-[#8c8f94] bg-white px-3 py-2 text-base";
const primary = "min-h-11 bg-[#2271b1] px-5 text-sm text-white disabled:opacity-50";
const secondary = "min-h-11 border border-[#2271b1] bg-white px-4 text-sm text-[#2271b1] disabled:opacity-50";

/** Shrinks a chosen picture to at most 1600px and saves it as JPEG, so pages stay fast. */
async function shrink(file: File) {
  const picture = await createImageBitmap(file, { imageOrientation: "from-image" });
  for (const [side, quality] of [[1600, 0.85], [1400, 0.75], [1100, 0.7]]) {
    const scale = Math.min(1, side / Math.max(picture.width, picture.height));
    const canvas = Object.assign(document.createElement("canvas"), { width: Math.round(picture.width * scale), height: Math.round(picture.height * scale) });
    const g = canvas.getContext("2d")!;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.drawImage(picture, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL("image/jpeg", quality);
    const data = url.slice(url.indexOf(",") + 1);
    if (data.length * 0.75 < Math.min(MAX_PHOTO_BYTES, 900_000) || side === 1100) return { data, url };
  }
  throw new Error("too large");
}

type Props = { id: string | null; sha: string; start: ProductDraft; categories: { slug: string; name: string }[] };

export function ProductForm({ id, sha, start, categories }: Props) {
  const [draft, setDraft] = useState(start);
  const [details, setDetails] = useState(start.details.join("\n"));
  const [sizes, setSizes] = useState(start.sizes.join(", "));
  const [uploads, setUploads] = useState<Record<string, { data: string; url: string }>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [confirm, setConfirm] = useState("");

  const set = (patch: Partial<ProductDraft>) => { setError(""); setDraft((d) => ({ ...d, ...patch })); };
  const preview = (p: string) => (p.startsWith("upload:") ? uploads[p.slice(7)]?.url : p);

  async function addPhotos(files: FileList | null) {
    setError("");
    for (const file of Array.from(files ?? [])) {
      try {
        const small = await shrink(file);
        const key = crypto.randomUUID();
        setUploads((u) => ({ ...u, [key]: small }));
        setDraft((d) => (d.photos.length >= MAX_PHOTOS ? d : { ...d, photos: [...d.photos, `upload:${key}`] }));
      } catch {
        setError(`"${file.name}" could not be read. Use a JPG or PNG photo.`);
      }
    }
  }
  const move = (i: number, by: number) => {
    const photos = [...draft.photos];
    [photos[i], photos[i + by]] = [photos[i + by], photos[i]];
    set({ photos });
  };
  const remove = (p: string) => set({ photos: draft.photos.filter((x) => x !== p), colours: draft.colours.map((c) => (c.photo === p ? { ...c, photo: "" } : c)) });

  async function send(payload: object) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const reply = await res.json().catch(() => ({}));
      if (res.status === 401) return window.location.assign("/admin/login");
      if (!res.ok) return setError(reply.error || "Not saved.");
      return reply as { id: string };
    } catch {
      setError("No connection. Reload the page to see what was saved.");
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const full: ProductDraft = { ...draft, details: details.split("\n").map((s) => s.trim()).filter(Boolean), sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean) };
    const problem = draftProblem(full, categories.map((c) => c.slug));
    if (problem) return setError(problem);
    const used = Object.fromEntries(full.photos.filter((p) => p.startsWith("upload:")).map((p) => [p.slice(7), uploads[p.slice(7)].data]));
    if (JSON.stringify(used).length > MAX_REQUEST_BYTES - 100_000) return setError("The new photos are too large together. Save with fewer photos, then add the rest.");
    if (await send({ action: "save", id, sha, draft: full, uploads: used })) setDone("Saved. The website rebuilds now; the change appears in about 2–3 minutes.");
  }

  if (done)
    return (
      <div role="status" className="mt-4 max-w-2xl border border-[#c3c4c7] border-l-4 border-l-[#00a32a] bg-white p-4">
        <p>{done}</p>
        {!id && <p className="mt-2 text-sm text-[#50575e]">A new product starts as Stock Out. When it appears in the Products list, set its price and stock there.</p>}
        <p className="mt-3"><Link href="/admin/products" className="text-[#2271b1] underline">Back to Products</Link></p>
      </div>
    );

  return (
    <form onSubmit={save} className="mt-4 max-w-3xl space-y-4">
      <section className="space-y-4 border border-[#c3c4c7] bg-white p-4">
        <label className="block text-sm font-semibold">Name<input className={input} value={draft.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} /></label>
        <label className="block text-sm font-semibold">
          Category
          <select className={`${input} min-h-11`} value={draft.category} onChange={(e) => set({ category: e.target.value })}>
            <option value="">Choose…</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">Description<textarea className={input} rows={4} maxLength={2000} value={draft.description} onChange={(e) => set({ description: e.target.value })} /></label>
        <label className="block text-sm font-semibold">Details (one per line)<textarea className={input} rows={3} value={details} onChange={(e) => { setError(""); setDetails(e.target.value); }} /></label>
        <label className="block text-sm font-semibold">Sizes (separate with commas)<input className={input} value={sizes} onChange={(e) => { setError(""); setSizes(e.target.value); }} /></label>
      </section>

      <section className="border border-[#c3c4c7] bg-white p-4">
        <h2 className="text-base font-semibold [font-family:inherit]">Photos</h2>
        <p className="mt-1 text-xs text-[#646970]">The first photo is the main one. Large photos are made smaller automatically.</p>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {draft.photos.map((p, i) => (
            <li key={p} className="border border-[#dcdcde]">
              <img src={preview(p)} alt={`Photo ${i + 1}`} className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between">
                <button type="button" className="flex h-11 w-11 items-center justify-center disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move photo ${i + 1} earlier`}><ArrowLeft className="h-4 w-4" /></button>
                <span className="text-xs">{i === 0 ? "Main" : i + 1}</span>
                <button type="button" className="flex h-11 w-11 items-center justify-center disabled:opacity-30" disabled={i === draft.photos.length - 1} onClick={() => move(i, 1)} aria-label={`Move photo ${i + 1} later`}><ArrowRight className="h-4 w-4" /></button>
                <button type="button" className="flex h-11 w-11 items-center justify-center text-[#b32d2e]" onClick={() => remove(p)} aria-label={`Remove photo ${i + 1}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
        {draft.photos.length < MAX_PHOTOS && (
          <label className="mt-3 block text-sm font-semibold">
            Add photos
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-1 block w-full text-sm" onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </section>

      <section className="space-y-3 border border-[#c3c4c7] bg-white p-4">
        <h2 className="text-base font-semibold [font-family:inherit]">Colours</h2>
        {draft.colours.map((c, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input className="min-h-11 flex-1 basis-40 border border-[#8c8f94] px-3" aria-label={`Colour ${i + 1} name`} placeholder="Colour name" maxLength={40} value={c.name} onChange={(e) => set({ colours: draft.colours.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
            <select className="min-h-11 border border-[#8c8f94] bg-white px-2" aria-label={`Colour ${i + 1} photo`} value={c.photo} onChange={(e) => set({ colours: draft.colours.map((x, j) => (j === i ? { ...x, photo: e.target.value } : x)) })}>
              <option value="">No photo</option>
              {draft.photos.map((p, n) => <option key={p} value={p}>Photo {n + 1}</option>)}
            </select>
            <button type="button" className={secondary} onClick={() => set({ colours: draft.colours.filter((_, j) => j !== i) })}>Remove</button>
          </div>
        ))}
        {draft.colours.length < 10 && <button type="button" className={secondary} onClick={() => set({ colours: [...draft.colours, { name: "", photo: "" }] })}>Add a colour</button>}
      </section>

      <section className="border border-[#c3c4c7] bg-white p-4">
        {([["visible", "Show on website"], ["isNew", "Mark as New"], ["bestSeller", "Best seller"]] as const).map(([key, label]) => (
          <label key={key} className="flex min-h-11 items-center gap-3 text-sm font-semibold">
            <input type="checkbox" className="h-5 w-5" checked={draft[key]} onChange={(e) => set({ [key]: e.target.checked })} />
            {label}
          </label>
        ))}
        <p className="text-xs text-[#646970]">To hide a product quickly, you can also untick “Show on website” on the Products list.</p>
      </section>

      {error && <p role="alert" className="border-l-4 border-[#d63638] bg-[#fcf0f1] p-3 text-sm">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={primary}>{busy ? "Saving…" : id ? "Save product" : "Add product"}</button>
        <Link href="/admin/products" className={`${secondary} flex items-center`}>Cancel</Link>
      </div>

      {id && (
        <details className="border border-[#c3c4c7] bg-white p-4 text-sm">
          <summary className="cursor-pointer text-[#b32d2e]">Delete this product permanently</summary>
          <p className="mt-3">Usually it is better to untick “Show on website”. Deleting removes the product’s page and words. Type <strong>{start.name}</strong> to confirm.</p>
          <input className={input} aria-label="Type the product name to confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button type="button" disabled={busy || confirm.trim() !== start.name.trim()} className="mt-3 min-h-11 bg-[#b32d2e] px-5 text-white disabled:opacity-50" onClick={async () => { if (await send({ action: "delete", id, sha, confirm })) setDone("Deleted. The website rebuilds now; it disappears in about 2–3 minutes."); }}>Delete permanently</button>
        </details>
      )}
    </form>
  );
}
