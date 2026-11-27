import { StoreShell } from "@/components/layout/StoreShell";

// Pages are rebuilt in the background at most every 5 minutes, so price and stock
// changes in the Products sheet reach the website without a new deployment.
export const revalidate = 300;

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
