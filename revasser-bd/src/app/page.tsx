import type { Metadata } from "next";
import { getLiveContent, getSeo } from "@/lib/content";
import { SITE, absolute, pageMeta } from "@/lib/seo";
import { JsonLd } from "@/components/ui/JsonLd";
import { SECTIONS } from "@/components/home/Sections";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  const seo = getSeo();
  return { ...pageMeta(seo.title, seo.description, "/"), title: { absolute: seo.title } };
}

export default async function HomePage() {
  const content = await getLiveContent();
  const seo = getSeo();
  return (
    <>
      {!content.sections.includes("Hero") && <h1 className="sr-only">{seo.title}</h1>}
      {content.sections.map((name) => {
        const Section = SECTIONS[name];
        return Section ? <Section key={name} content={content} /> : null;
      })}
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: seo.siteName,
            url: SITE,
            logo: absolute("/brand/logo/icon.svg"),
            email: content.footer.supportEmail || undefined,
            telephone: content.checkout.whatsapp ? `+${content.checkout.whatsapp}` : undefined,
            sameAs: content.footer.socials.map((s) => s.url),
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: seo.siteName,
            url: SITE,
          },
        ]}
      />
    </>
  );
}
