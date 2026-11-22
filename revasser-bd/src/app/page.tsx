import StorefrontApp from "@/components/StorefrontApp";
import { getContent } from "@/lib/content";

export const dynamic = "force-static";

export default function HomePage() {
  return <StorefrontApp content={getContent()} />;
}
