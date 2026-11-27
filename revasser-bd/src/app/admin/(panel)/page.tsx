import { requireAdmin } from "@/lib/admin";
import { Placeholder } from "@/components/admin/Placeholder";

export default async function Dashboard() {
  await requireAdmin();
  return <Placeholder slug="" />;
}
