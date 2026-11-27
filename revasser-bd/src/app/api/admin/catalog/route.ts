import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentAdmin, tooMany } from "@/lib/admin";
import { getContent } from "@/lib/content";
import { commit, githubReady, GitHubError, listFolder, readFile, type Change } from "@/lib/github";
import { draftFrom, draftProblem, ID_PATTERN, MAX_PHOTO_BYTES, MAX_REQUEST_BYTES, slugFor, type ProductDraft } from "@/lib/catalog-edit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
const file = (id: string) => `content/products/${id}.json`;
class Stale extends Error {}
const CHANGED = "This product was changed somewhere else while you were editing, so nothing was saved. Reload the page and make your change again.";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host")) return fail("Not allowed.", 403);
  const admin = await currentAdmin();
  if (!admin) return fail("Please sign in again.", 401);
  if (!githubReady()) return fail("Photo and product saving is not set up yet. Add GITHUB_TOKEN in Vercel, then deploy again.", 503);
  if (tooMany(`admin-catalog:${admin.email}`, 40)) return fail("Too many saves at once. Please wait a few minutes.", 429);

  let body: { action?: string; id?: string | null; sha?: string; draft?: ProductDraft; uploads?: Record<string, string>; confirm?: string };
  try {
    const raw = await req.text();
    if (raw.length > MAX_REQUEST_BYTES) return fail("The photos are too large together. Add fewer photos at a time.", 413);
    body = JSON.parse(raw);
  } catch {
    return fail("Please reload the page and try again.", 400);
  }
  const { action, sha } = body;
  let id = body.id ?? "";
  if (id && (!ID_PATTERN.test(id) || id === "new")) return fail("Please reload the page and try again.", 400);

  try {
    const current = id ? await readFile(file(id)) : null;
    if (id && (!current || current.sha !== sha)) return fail(CHANGED, 409);
    // Runs again just before writing, against the newest files.
    const unchanged = async () => {
      const now = await readFile(file(id));
      if ((now?.sha ?? "") !== (current?.sha ?? "")) throw new Stale();
    };

    if (action === "delete") {
      if (!current) return fail("That product no longer exists.", 404);
      const name = String(JSON.parse(current.text).name ?? "");
      if (body.confirm?.trim() !== name.trim()) return fail("Type the product name exactly to delete it.", 400);
      await commit(`Admin: delete product ${id}`, [{ path: file(id), content: null }], unchanged);
      return NextResponse.json({ ok: true, id });
    }
    if (action !== "save") return fail("Please reload the page and try again.", 400);

    const draft = body.draft as ProductDraft;
    const problem = draftProblem(draft, getContent().categories.map((c) => c.slug));
    if (problem) return fail(problem, 400);

    const existing: Record<string, unknown> = current ? JSON.parse(current.text) : {};
    if (!id) {
      const taken = new Set((await listFolder("content/products")).map((n) => n.replace(/\.json$/, "")));
      const base = slugFor(draft.name) || `product-${crypto.randomBytes(3).toString("hex")}`;
      id = base;
      for (let n = 2; taken.has(id) || id === "new"; n++) id = `${base}-${n}`;
    }

    // Only photos this product already has, or new uploads in this request, may be used.
    const known = new Set(current ? draftFrom(existing).photos : []);
    const changes: Change[] = [];
    const address = new Map<string, string>();
    for (const photo of draft.photos) {
      if (known.has(photo)) {
        address.set(photo, photo);
        continue;
      }
      const data = photo.startsWith("upload:") ? body.uploads?.[photo.slice(7)] : undefined;
      if (typeof data !== "string" || !/^[A-Za-z0-9+/]+=*$/.test(data)) return fail("A photo did not upload properly. Remove it and add it again.", 400);
      const bytes = Buffer.from(data, "base64");
      if (bytes.length > MAX_PHOTO_BYTES || bytes.length < 100 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return fail("Each photo must be a JPEG under 1.5 MB.", 400);
      const name = `${id.slice(0, 60)}-${crypto.randomBytes(4).toString("hex")}.jpg`;
      changes.push({ path: `public/uploads/${name}`, content: bytes });
      address.set(photo, `/uploads/${name}`);
    }
    const photos = draft.photos.map((p) => address.get(p)!);
    const trim = (list: string[]) => list.map((s) => s.trim());

    // Prices, reviews and other fields already in the file are kept.
    const next = {
      ...(current ? existing : { price: null, salePrice: null, availability: "Confirm by phone", reviews: [], order: 9999 }),
      name: draft.name.trim(),
      category: draft.category,
      photo: "",
      photoUrl: photos[0] ?? "",
      morePhotos: [],
      morePhotoUrls: photos.slice(1),
      description: draft.description.trim(),
      details: trim(draft.details),
      colours: draft.colours.map((c) => ({ name: c.name.trim(), photoUrl: c.photo ? address.get(c.photo)! : "" })),
      sizes: trim(draft.sizes),
      isNew: draft.isNew,
      bestSeller: draft.bestSeller,
      visible: draft.visible,
    };
    changes.push({ path: file(id), content: Buffer.from(`${JSON.stringify(next, null, 2)}\n`) });
    await commit(`Admin: ${current ? "update" : "add"} product ${id}`, changes, unchanged);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    if (err instanceof Stale) return fail(CHANGED, 409);
    console.error("Product not saved to GitHub:", err);
    if (err instanceof GitHubError && [401, 403].includes(err.status)) return fail("GitHub refused the access key. Check GITHUB_TOKEN in Vercel and that it can write to this repository.", 502);
    return fail("We could not confirm the save. Reload the page to see what was saved.", 502);
  }
}
