"use client";

import { useEffect, useRef, useState } from "react";

const SCRIPT = "https://accounts.google.com/gsi/client";

export function AdminSignIn({ clientId }: { clientId: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const draw = () => {
      if (!window.google || !box.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }: { credential: string }) => {
          setError("");
          const res = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
          if (res.ok) window.location.assign("/admin");
          else setError((await res.json().catch(() => ({}))).error || "Sign-in did not work.");
        },
      });
      window.google.accounts.id.renderButton(box.current, { theme: "outline", size: "large", text: "signin_with", locale: "en" });
    };
    if (window.google) return draw();
    const script = Object.assign(document.createElement("script"), { src: SCRIPT, async: true, onload: draw });
    document.head.appendChild(script);
  }, [clientId]);

  return (
    <>
      <div ref={box} className="flex min-h-[44px] justify-center" />
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </>
  );
}
