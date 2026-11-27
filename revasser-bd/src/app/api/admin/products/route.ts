import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { currentAdmin, tooMany } from "@/lib/admin";
import { saveProduct } from "@/lib/admin-products";
import { FIELDS, problemWith, type Field, type SheetProduct } from "@/lib/product-edit";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number, extra: object = {}) => NextResponse.json({ error, ...extra }, { status });

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host")) return fail("Not allowed.", 403);
  const admin = await currentAdmin();
  if (!admin) return fail("Please sign in again.", 401);
  if (tooMany(`admin-save:${admin.email}`, 120)) return fail("Too many changes at once. Please wait a few minutes.", 429);

  let id: string, expected: Record<string, unknown>, changes: Record<string, unknown>;
  try {
    ({ id, expected, changes } = await req.json());
    if (typeof id !== "string" || !/^[a-z0-9ঀ-৿-]{1,120}$/.test(id) || !expected || !changes) throw new Error("shape");
  } catch {
    return fail("Please reload the page and try again.", 400);
  }
  const keys = Object.keys(changes);
  if (!keys.length || !keys.every((k) => (FIELDS as readonly string[]).includes(k))) return fail("Nothing to save.", 400);
  const problem = problemWith({ ...expected, ...changes } as unknown as SheetProduct, keys as Field[]);
  if (problem) return fail(problem, 400);

  try {
    const result = await saveProduct(id, expected, changes, admin.email);
    if (!result.ok) return fail(result.error, result.status, { product: result.product });
    // Show the new price and stock on the shop straight away.
    revalidateTag("products-sheet");
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, product: result.product });
  } catch (err) {
    console.error("Product not saved:", err);
    return fail("We could not confirm the change. Reload the page to see what the sheet holds.", 502);
  }
}
