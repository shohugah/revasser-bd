import type { Metadata, Viewport } from "next";
import { getDesign, getSeo } from "@/lib/content";
import { fontVariables } from "@/lib/fonts";
import { OG_IMAGE, SITE } from "@/lib/seo";
import "./globals.css";

export function generateMetadata(): Metadata {
  const seo = getSeo();
  return {
    metadataBase: new URL(SITE),
    title: { default: seo.title, template: `%s | ${seo.siteName}` },
    description: seo.description,
    openGraph: { title: seo.title, description: seo.shareText, siteName: seo.siteName, locale: "en_BD", type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", images: [OG_IMAGE] },
  };
}

export function generateViewport(): Viewport {
  return { themeColor: "#3A1620", width: "device-width", initialScale: 1 };
}

// The shop's header and footer live in components/layout/StoreShell, so /admin can have its own screen.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { variables, headingFont, bodyFont } = getDesign();
  return (
    <html lang="en" style={{ ...variables, ...fontVariables(headingFont, bodyFont) } as React.CSSProperties}>
      <body>{children}</body>
    </html>
  );
}
