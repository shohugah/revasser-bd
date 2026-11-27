// What the product form sends, and the rules it must pass. Used by the browser and the server.

export interface ProductDraft {
  name: string;
  category: string;
  description: string;
  details: string[];
  colours: { name: string; photo: string }[];
  sizes: string[];
  /** Existing photo addresses, or "upload:<key>" for a new one. The first is the main photo. */
  photos: string[];
  isNew: boolean;
  bestSeller: boolean;
  visible: boolean;
}

export const ID_PATTERN = /^[a-z0-9ঀ-৿-]{1,120}$/;
export const MAX_PHOTOS = 10;
export const MAX_PHOTO_BYTES = 1_500_000;
/** Vercel refuses requests over 4.5 MB. */
export const MAX_REQUEST_BYTES = 4_000_000;

export const emptyDraft: ProductDraft = { name: "", category: "", description: "", details: [], colours: [], sizes: [], photos: [], isNew: true, bestSeller: false, visible: true };

const line = (v: unknown, max: number) => typeof v === "string" && v.trim().length > 0 && v.length <= max && !/[\u0000-\u001f]/.test(v);
const lines = (v: unknown, count: number, max: number) => Array.isArray(v) && v.length <= count && v.every((x) => line(x, max));

export function draftProblem(d: ProductDraft, categories: string[]) {
  if (!d || typeof d !== "object") return "Please reload the page and try again.";
  if (!line(d.name, 120)) return "Enter a name of up to 120 characters.";
  if (!categories.includes(d.category)) return "Choose a category.";
  if (typeof d.description !== "string" || d.description.length > 2000) return "Description can be up to 2,000 characters.";
  if (!lines(d.details, 12, 200)) return "Use up to 12 detail lines of 200 characters each.";
  if (!lines(d.sizes, 20, 20)) return "Use up to 20 sizes, each up to 20 characters.";
  if (!Array.isArray(d.colours) || d.colours.length > 10 || !d.colours.every((c) => c && line(c.name, 40) && typeof c.photo === "string" && (!c.photo || d.photos?.includes(c.photo)))) return "Each colour needs a name (up to 40 characters) and, optionally, one of this product's photos.";
  if (new Set(d.colours.map((c) => c.name.trim().toLowerCase())).size !== d.colours.length) return "Two colours have the same name.";
  if (!Array.isArray(d.photos) || d.photos.length > MAX_PHOTOS || !d.photos.every((p) => typeof p === "string") || new Set(d.photos).size !== d.photos.length) return `Use up to ${MAX_PHOTOS} photos.`;
  if (![d.isNew, d.bestSeller, d.visible].every((b) => typeof b === "boolean")) return "Please reload the page and try again.";
  if (d.visible && !d.photos.length) return "Add at least one photo, or untick Show on website.";
  return "";
}

export function slugFor(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

/** Reads a product file into the form. */
export function draftFrom(file: Record<string, unknown>): ProductDraft {
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  const photos = [text(file.photo) || text(file.photoUrl), ...list(file.morePhotos).map(text), ...list(file.morePhotoUrls).map(text)].filter(Boolean);
  const unique = Array.from(new Set(photos));
  return {
    name: text(file.name),
    category: text(file.category),
    description: text(file.description),
    details: list(file.details).map(text).filter(Boolean),
    colours: list(file.colours).map((c: Record<string, unknown>) => ({ name: text(c?.name), photo: text(c?.photo) || text(c?.photoUrl) })).filter((c) => c.name).map((c) => ({ ...c, photo: unique.includes(c.photo) ? c.photo : "" })),
    sizes: list(file.sizes).map(text).filter(Boolean),
    photos: unique,
    isNew: file.isNew === true,
    bestSeller: file.bestSeller === true,
    visible: file.visible !== false,
  };
}
