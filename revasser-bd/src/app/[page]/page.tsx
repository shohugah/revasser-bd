import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";

type Props = { params: Promise<{ page: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getContent().pages.map((p) => ({ page: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  const found = getContent().pages.find((p) => p.slug === page);
  return found ? pageMeta(found.title, found.intro, `/${page}`) : {};
}

export default async function InformationPage({ params }: Props) {
  const { page } = await params;
  const found = getContent().pages.find((p) => p.slug === page);
  if (!found) notFound();
  return (
    <article className="shell pb-24">
      <PageIntro eyebrow="Customer care" title={found.title} text={found.intro} />
      <div className="max-w-4xl">
        {found.sections.map((s, i) => (
          <section key={i} className="grid gap-2 border-t border-ink/15 py-7 sm:grid-cols-[15rem_1fr] sm:gap-8">
            <h2 className="text-2xl">{s.title}</h2>
            <p className="whitespace-pre-line text-muted">{s.text}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
