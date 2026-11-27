import { pageMeta } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";
import { WishlistView } from "@/components/shop/WishlistView";

export const metadata = { ...pageMeta("Wishlist", "Pieces you saved.", "/wishlist"), robots: { index: false, follow: true } };

export default function Page() {
  return (
    <div className="shell pb-24">
      <PageIntro title="Wishlist" text="Saved on this device, no account needed." />
      <WishlistView />
    </div>
  );
}
