import { pageMeta } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";
import { CheckoutForm } from "@/components/shop/CheckoutForm";

export const metadata = { ...pageMeta("Checkout", "Complete your Revasser order.", "/checkout"), robots: { index: false, follow: true } };

export default function Page() {
  return (
    <div className="shell pb-24">
      <PageIntro title="Checkout" text="" />
      <CheckoutForm />
    </div>
  );
}
