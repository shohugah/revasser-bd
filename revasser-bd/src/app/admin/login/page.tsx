import { redirect } from "next/navigation";
import { getContent } from "@/lib/content";
import { adminReady, currentAdmin } from "@/lib/admin";
import { AdminSignIn } from "@/components/admin/AdminSignIn";

export default async function AdminLogin() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f0f0f1] px-4 text-[#1d2327]">
      <div className="w-full max-w-sm border border-[#c3c4c7] bg-white p-8 text-center shadow-sm">
        <img src="/brand/logo/lockup-ink.png" alt="Revasser" width={1310} height={240} className="mx-auto h-8 w-auto" />
        <h1 className="mt-6 text-xl [font-family:inherit]">Admin sign in</h1>
        <p className="mb-6 mt-2 text-sm text-[#50575e]">Only approved Google accounts can enter.</p>
        {adminReady() ? (
          <AdminSignIn clientId={getContent().checkout.googleClientId} />
        ) : (
          <p role="status" className="text-sm text-red-700">Admin access is not set up yet.</p>
        )}
      </div>
    </main>
  );
}
