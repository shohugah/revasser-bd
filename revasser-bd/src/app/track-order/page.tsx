import { pageMeta } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";
import { TrackForm } from "@/components/shop/TrackForm";

export const metadata = { ...pageMeta("Track your order", "Check the status of your Revasser order.", "/track-order"), robots: { index: false, follow: true } };

export default function Page() {
  return (
    <div className="shell pb-24">
      <PageIntro title="Where is my order?" text="Enter your order number and the mobile number you ordered with." />
      <TrackForm />
    </div>
  );
}
