import { requireAdmin } from "@/lib/admin";
import { getContent } from "@/lib/content";
import { githubReady } from "@/lib/github";
import { emptyDraft } from "@/lib/catalog-edit";
import { ProductForm } from "@/components/admin/ProductForm";
import { Problem } from "@/components/admin/Widgets";

export default async function NewProduct() {
  await requireAdmin();
  const categories = getContent().categories.map((c) => ({ slug: c.slug, name: c.name }));
  return (
    <>
      <h1 className="text-2xl [font-family:inherit]">Add product</h1>
      {githubReady() ? <ProductForm id={null} sha="" start={emptyDraft} categories={categories} /> : <Problem text="Adding products is not set up yet. Add GITHUB_TOKEN in Vercel, then deploy again." />}
    </>
  );
}
