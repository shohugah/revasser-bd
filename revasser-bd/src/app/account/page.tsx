import { pageMeta } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";
import { AccountView } from "@/components/shop/AccountView";

export const metadata = { ...pageMeta("My Revasser", "Your orders and saved pieces on this device.", "/account"), robots: { index: false, follow: true } };

export default function Page() {
  return (
    <div className="shell pb-24">
      <PageIntro title="My Revasser" text="Your orders, saved pieces and details, without another password to remember." />
      <AccountView />
    </div>
  );
}
