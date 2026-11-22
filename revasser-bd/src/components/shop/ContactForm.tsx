"use client";

import { useState } from "react";
import { whatsAppChatUrl } from "@/lib/whatsapp";
import { useStore } from "../StoreProvider";

export function ContactForm() {
  const { checkout, store } = useStore().data;
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);
  if (!checkout.whatsapp && !store.email) return null;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const text = `Hello Revasser, this is ${name.trim()}.\n\n${message.trim()}`;
        if (checkout.whatsapp) window.open(whatsAppChatUrl(checkout.whatsapp, text), "_blank", "noopener,noreferrer");
        else window.location.href = `mailto:${store.email}?subject=${encodeURIComponent("Website enquiry")}&body=${encodeURIComponent(text)}`;
        setOpened(true);
      }}
    >
      <div>
        <label htmlFor="contact-name" className="label text-muted">Your name</label>
        <input id="contact-name" required maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="field" />
      </div>
      <div>
        <label htmlFor="contact-message" className="label text-muted">How can we help?</label>
        <textarea id="contact-message" required rows={4} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} className="field" />
      </div>
      <button className="btn-dark w-full sm:w-auto">{checkout.whatsapp ? "Continue in WhatsApp" : "Continue in email"}</button>
      {opened && <p role="status" className="text-sm text-muted">Press Send there. Your message reaches us only after you send it.</p>}
    </form>
  );
}
