import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getContent } from "@/lib/content";
import { githubReady, readFile } from "@/lib/github";
import { draftFrom, ID_PATTERN } from "@/lib/catalog-edit";
import { ProductForm } from "@/components/admin/ProductForm";
import { Problem } from "@/components/admin/Widgets";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = decodeURIComponent((await params).id);
  if (!ID_PATTERN.test(id)) notFound();
  const title = <h1 className="text-2xl [font-family:inherit]">Photos and details</h1>;
  if (!githubReady()) return <>{title}<Problem text="Editing photos and details is not set up yet. Add GITHUB_TOKEN in Vercel, then deploy again." /></>;

  let found: Awaited<ReturnType<typeof readFile>> = null;
  let draft;
  try {
    found = await readFile(`content/products/${id}.json`);
    if (found) draft = draftFrom(JSON.parse(found.text));
  } catch (err) {
    console.error("Product file not read:", err);
    return <>{title}<Problem text="Could not read the product from GitHub. Check GITHUB_TOKEN in Vercel, or try again in a minute." /></>;
  }
  if (!found || !draft) return <>{title}<Problem text="This product has no page on the website. It may have been deleted." /></>;
  const categories = getContent().categories.map((c) => ({ slug: c.slug, name: c.name }));
  return (
    <>
      {title}
      <p className="mt-1 text-sm text-[#50575e]">Price and stock are changed on the Products list.</p>
      <ProductForm key={found.sha} id={id} sha={found.sha} start={draft} categories={categories} />
    </>
  );
}
