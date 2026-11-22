import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import type { Content } from "@/lib/content";
import { whatsAppChatUrl } from "@/lib/whatsapp";
import { Logo } from "../ui/Logo";
import { SOCIAL_ICONS } from "../ui/icons";

export function Footer({ content }: { content: Content }) {
  const { footer, header, checkout, pages } = content;
  const heading = "label mb-4 text-accent";
  const item = "inline-flex min-h-10 items-center hover:text-page";
  return (
    <footer className="bg-ink text-page/70">
      <div className="shell grid grid-cols-2 gap-x-6 gap-y-12 py-16 text-sm md:grid-cols-4 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr] lg:py-24">
        <div className="col-span-2 md:col-span-4 lg:col-span-1">
          <Logo tone="ivory" className="h-9 w-auto" />
          <p className="mt-6 max-w-xs leading-relaxed">{footer.about}</p>
          {footer.socials.length > 0 && (
            <ul className="mt-7 flex gap-2">
              {footer.socials.map(({ name, url }) => {
                const Icon = SOCIAL_ICONS[name as keyof typeof SOCIAL_ICONS];
                return (
                  <li key={name}>
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name} className="flex h-11 w-11 items-center justify-center border border-page/20 transition-colors hover:border-accent hover:text-page">
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <nav aria-label="Footer shop">
          <h2 className={`${heading} font-sans`}>Shop</h2>
          <ul>
            <li><Link href="/shop" className={item}>Shop all</Link></li>
            {header.nav.map((n) => <li key={n.href + n.label}><Link href={n.href} className={item}>{n.label}</Link></li>)}
            <li><Link href="/pre-order" className={item}>Pre-order fashion</Link></li>
          </ul>
        </nav>

        <nav aria-label="Footer help">
          <h2 className={`${heading} font-sans`}>{footer.careTitle || "Customer care"}</h2>
          <ul>
            {footer.trackLink && <li><Link href="/track-order" className={item}>{footer.trackLink}</Link></li>}
            {pages.map((p) => <li key={p.slug}><Link href={`/${p.slug}`} className={item}>{p.title}</Link></li>)}
            <li><Link href="/contact" className={item}>Contact</Link></li>
            <li><Link href="/about" className={item}>Our story</Link></li>
            {footer.careLines.map((line, i) => <li key={i} className="flex min-h-10 items-center">{line}</li>)}
          </ul>
        </nav>

        <div className="col-span-2 md:col-span-2 lg:col-span-1">
          <h2 className={`${heading} font-sans`}>{footer.supportLabel}</h2>
          <ul>
            {checkout.whatsapp && (
              <li>
                <a href={whatsAppChatUrl(checkout.whatsapp, "Hello Revasser, I have a question.")} target="_blank" rel="noopener noreferrer" className={`${item} gap-3`}>
                  <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={1.25} />
                  WhatsApp 0{checkout.whatsapp.slice(3)}
                </a>
              </li>
            )}
            {footer.supportEmail && (
              <li>
                <a href={`mailto:${footer.supportEmail}`} className={`${item} gap-3 break-all`}>
                  <Mail className="h-4 w-4 shrink-0" strokeWidth={1.25} />
                  {footer.supportEmail}
                </a>
              </li>
            )}
          </ul>
          {footer.paymentsTitle && <h2 className={`${heading} mt-7 font-sans`}>{footer.paymentsTitle}</h2>}
          <p>{footer.paymentsText}</p>
        </div>
      </div>
      <div className="border-t border-page/15">
        <p className="shell flex flex-wrap justify-between gap-2 py-5 text-xs">
          <span>© {new Date().getFullYear()} Revasser</span>
          <span>Dhaka, Bangladesh</span>
        </p>
      </div>
    </footer>
  );
}
