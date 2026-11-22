import { pageMeta } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";
import { TrackForm } from "@/components/shop/TrackForm";

export const metadata = { ...pageMeta("Order update", "Ask for an update on your Revasser order.", "/track-order"), robots: { index: false, follow: true } };

export default function Page() {
  return (
    <div className="shell pb-24">
      <PageIntro title="Where is my order?" text="Send us your reference and a person will reply with the latest update." />
      <TrackForm />
    </div>
  );
}
