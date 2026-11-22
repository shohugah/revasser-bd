import type { Metadata } from "next";
import { getDesign, getSeo } from "@/lib/content";
import "./globals.css";

export function generateMetadata(): Metadata {
  const seo = getSeo();
  return {
    metadataBase: new URL("https://revasserbd.shop"),
    title: { default: seo.title, template: `%s | ${seo.siteName}` },
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.shareText,
      url: "https://revasserbd.shop",
      siteName: seo.siteName,
      locale: "en_BD",
      type: "website",
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { variables, fontUrl } = getDesign();
  return (
    <html lang="en" style={variables as React.CSSProperties}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={fontUrl} rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-page text-ink">{children}</body>
    </html>
  );
}
