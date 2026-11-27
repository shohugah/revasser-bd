"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { SECTIONS } from "./sections";
import { Pending } from "./Pending";

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    // A full load clears any admin page kept in the browser's memory.
    window.location.assign("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#1d2327]">
      <header className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-3 bg-[#1d2327] px-2 text-sm text-white sm:px-4">
        <button className="flex h-10 w-10 items-center justify-center md:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <span className="font-semibold">Revasser Admin</span>
        <a href="/" target="_blank" rel="noopener noreferrer" aria-label="View shop" className="flex min-h-10 items-center gap-1.5 text-white/75 hover:text-white">
          <ExternalLink className="h-4 w-4" /><span className="hidden sm:inline">View shop</span>
        </a>
        <span className="ml-auto hidden truncate text-white/75 sm:inline">{email}</span>
        <button onClick={signOut} className="ml-auto flex min-h-10 items-center gap-1.5 px-2 hover:text-[#72aee6] sm:ml-0"><LogOut className="h-4 w-4" />Sign out</button>
      </header>
      {open && <button aria-hidden="true" tabIndex={-1} className="fixed inset-0 top-12 z-10 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
      <nav aria-label="Admin" className={`fixed bottom-0 left-0 top-12 z-20 w-56 overflow-y-auto bg-[#1d2327] py-2 text-sm text-[#f0f0f1] md:visible md:w-14 md:translate-x-0 lg:w-56 ${open ? "" : "invisible -translate-x-full"}`}>
        {SECTIONS.map(({ slug, name, icon: Icon }) => {
          const href = slug ? `/admin/${slug}` : "/admin";
          const active = path === href;
          return (
            <Link key={slug} href={href} title={name} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 px-4 ${active ? "bg-[#2271b1] text-white" : "hover:bg-[#2c3338] hover:text-[#72aee6]"}`}>
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <span className="md:sr-only lg:not-sr-only">{name}</span>
              <Pending />
            </Link>
          );
        })}
      </nav>
      <main className="px-4 pb-10 pt-16 md:ml-14 lg:ml-56 lg:px-8">{children}</main>
    </div>
  );
}
