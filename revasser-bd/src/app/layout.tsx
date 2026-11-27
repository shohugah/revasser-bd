import type { Metadata, Viewport } from "next";
import { getDesign, getLiveContent, getSeo, getStoreData } from "@/lib/content";
import { fontVariables } from "@/lib/fonts";
import { OG_IMAGE, SITE } from "@/lib/seo";
import { StoreProvider } from "@/components/StoreProvider";
import { Header } from "@/components/layout/Header";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchPanel } from "@/components/layout/SearchPanel";
import { BagPanel } from "@/components/layout/BagPanel";
import { QuickView } from "@/components/layout/QuickView";
import { SignInPanel } from "@/components/layout/SignInPanel";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

// Pages are rebuilt in the background at most every 5 minutes, so price and stock
// changes in the Products sheet reach the website without a new deployment.
export const revalidate = 300;

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getLiveContent();
  const { variables, headingFont, bodyFont } = getDesign();
  const { header } = content;
  return (
    <html lang="en" style={{ ...variables, ...fontVariables(headingFont, bodyFont) } as React.CSSProperties}>
      <body>
        <a href="#main" className="sr-only z-50 bg-ink px-5 py-3 text-page focus:not-sr-only focus:fixed focus:left-2 focus:top-2">
          Skip to content
        </a>
        <StoreProvider data={await getStoreData()}>
          <Header
            nav={header.nav}
            announcements={header.announcements}
            logoImage={header.logoImage}
            badge={header.badge}
            searchPlaceholder={header.searchPlaceholder || "Search"}
            trackLabel={header.trackLabel}
            showTrack={header.showTrack}
          />
          <main id="main" tabIndex={-1} className="page-in min-h-[100svh] outline-none">{children}</main>
          <Footer content={content} />
          <MobileMenu nav={header.nav} showTrack={header.showTrack} trackLabel={header.trackLabel} />
          <SearchPanel placeholder={header.searchPlaceholder || "Search"} />
          <BagPanel />
          <QuickView />
          <SignInPanel />
        </StoreProvider>
      </body>
    </html>
  );
}
