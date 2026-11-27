import { requireAdmin } from "@/lib/admin";
import { listProducts } from "@/lib/admin-products";
import { getContent } from "@/lib/content";
import { Problem } from "@/components/admin/Widgets";
import { ProductEditor } from "@/components/admin/ProductEditor";

export default async function Products() {
  await requireAdmin();
  const result = await listProducts();
  const title = <h1 className="text-2xl [font-family:inherit]">Products</h1>;
  if ("problem" in result) return <>{title}<Problem text={result.problem} /></>;

  const site = new Map(getContent().products.map((p) => [p.id, p]));
  const rows = result.products.map((p) => ({
    ...p,
    image: site.get(p.id)?.images[0] ?? "",
    category: site.get(p.id)?.categoryName || p.category || "",
    onSite: site.has(p.id),
  }));
  return (
    <>
      {title}
      <p className="mt-1 text-sm text-[#50575e]">Changes are saved in the Products tab of your sheet. Adding products and photos comes in the next part.</p>
      <ProductEditor rows={rows} />
    </>
  );
}
