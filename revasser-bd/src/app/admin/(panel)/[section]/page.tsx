import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { Placeholder } from "@/components/admin/Placeholder";
import { SECTIONS } from "@/components/admin/sections";

export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  await requireAdmin();
  const { section } = await params;
  if (!SECTIONS.some((s) => s.slug && s.slug === section)) notFound();
  return <Placeholder slug={section} />;
}
