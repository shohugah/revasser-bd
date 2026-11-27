import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { githubReady, listFolder } from "@/lib/github";
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
  // Product files that have no row in the list, for example ones hidden from the start.
  const listed = new Set(rows.map((r) => r.id));
  const others = githubReady() ? await listFolder("content/products").then((n) => n.map((x) => x.replace(/\.json$/, "")).filter((x) => !listed.has(x))).catch(() => []) : [];
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {title}
        <Link href="/admin/products/new" className="flex min-h-10 items-center border border-[#2271b1] bg-white px-3 text-sm text-[#2271b1]">Add product</Link>
      </div>
      <p className="mt-1 text-sm text-[#50575e]">Price and stock are saved in your sheet at once. Photos and details take about 2–3 minutes to appear.</p>
      <ProductEditor rows={rows} />
      {others.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-[#2271b1]">Other product pages not in this list ({others.length})</summary>
          <ul className="mt-2 space-y-1">
            {others.map((id) => <li key={id}><Link href={`/admin/products/${id}`} className="inline-block py-1 text-[#2271b1] underline">{id}</Link></li>)}
          </ul>
        </details>
      )}
    </>
  );
}
