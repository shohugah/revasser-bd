"use client";

import Link from "next/link";
import { User, X } from "lucide-react";
import { useStore } from "../StoreProvider";
import { Panel } from "../ui/Panel";
import { GoogleSignIn } from "../shop/GoogleSignIn";

export function SignInPanel() {
  const { panel, close, user } = useStore();
  const open = panel === "signin";
  return (
    <Panel open={open} onClose={close} side="right" label="Sign in">
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink/10 pl-6 pr-2">
          <h2 className="font-serif text-2xl">{user ? "My account" : "Sign in"}</h2>
          <button className="flex min-h-11 items-center gap-2 px-4 text-sm" onClick={close}><X className="h-5 w-5" strokeWidth={1.25} />Close</button>
        </div>
        <div className="border-b border-ink/10 px-6 py-8">
          {open && <GoogleSignIn hint="Use your Gmail account. No new password to remember." />}
          {user && (
            // A link to the page you are already on would not change the path, so close on click.
            <Link href="/account" onClick={close} className="btn-dark mt-6 w-full">My orders</Link>
          )}
        </div>
        {!user && (
          <div className="border-b border-ink/10 px-6 py-8 text-center">
            <User className="mx-auto h-14 w-14 text-ink/15" strokeWidth={1} />
            <p className="mt-4 font-medium">No account yet?</p>
            <p className="mt-2 text-sm text-muted">Signing in with Google creates it for you. You can also order as a guest.</p>
          </div>
        )}
      </div>
    </Panel>
  );
}
