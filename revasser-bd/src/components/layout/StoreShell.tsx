import { getDesign, getLiveContent, getStoreData } from "@/lib/content";
import { StoreProvider } from "@/components/StoreProvider";
import { Header } from "@/components/layout/Header";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchPanel } from "@/components/layout/SearchPanel";
import { BagPanel } from "@/components/layout/BagPanel";
import { QuickView } from "@/components/layout/QuickView";
import { SignInPanel } from "@/components/layout/SignInPanel";
import { Footer } from "@/components/layout/Footer";

/** The customer-facing shop: header, footer, bag and panels. The admin area does not use it. */
export async function StoreShell({ children }: { children: React.ReactNode }) {
  const content = await getLiveContent();
  const { header } = content;
  return (
    <>
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
    </>
  );
}
