"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "../StoreProvider";

declare global {
  interface Window { google?: { accounts: { id: { initialize: (o: object) => void; renderButton: (el: HTMLElement, o: object) => void; disableAutoSelect: () => void } } } }
}

const SCRIPT = "https://accounts.google.com/gsi/client";

/** "Sign in with Google" when signed out; the account line with "Sign out" when signed in. */
export function GoogleSignIn({ hint }: { hint: string }) {
  const { data, user, setUser } = useStore();
  const clientId = data.checkout.googleClientId;
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clientId || user !== null) return;
    const draw = () => {
      if (!window.google || !box.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }: { credential: string }) => {
          setError("");
          const res = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
          const body = await res.json().catch(() => ({}));
          if (body.user) setUser(body.user);
          else setError(body.error || "Google sign-in did not work.");
        },
      });
      window.google.accounts.id.renderButton(box.current, { theme: "outline", size: "large", text: "signin_with", shape: "rectangular", locale: "en" });
    };
    if (window.google) return draw();
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    if (!script) {
      script = Object.assign(document.createElement("script"), { src: SCRIPT, async: true });
      document.head.appendChild(script);
    }
    script.addEventListener("load", draw);
    return () => script.removeEventListener("load", draw);
  }, [clientId, user, setUser]);

  if (!clientId || user === undefined) return null;
  if (user)
    return (
      <p className="text-sm">
        Signed in as <span className="font-medium">{user.email}</span>.{" "}
        <button
          type="button"
          className="underline underline-offset-4"
          onClick={async () => {
            await fetch("/api/auth", { method: "DELETE" });
            window.google?.accounts.id.disableAutoSelect();
            setUser(null);
          }}
        >
          Sign out
        </button>
      </p>
    );
  return (
    <div>
      <p className="mb-2 text-sm text-muted">{hint}</p>
      <div ref={box} className="min-h-[44px]" />
      {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}
