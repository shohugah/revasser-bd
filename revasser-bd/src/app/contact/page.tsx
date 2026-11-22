import { getContent } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { whatsAppChatUrl } from "@/lib/whatsapp";
import { PageIntro } from "@/components/ui/PageIntro";
import { ContactForm } from "@/components/shop/ContactForm";

export const metadata = pageMeta("Contact", "Contact Revasser on WhatsApp or by email for orders, pre-orders, delivery and exchanges.", "/contact");

export default function ContactPage() {
  const { checkout, footer } = getContent();
  return (
    <div className="shell pb-24">
      <PageIntro title="Talk to a person." text="Orders, sizing, pre-orders or a ring you saw on our page. Ask us anything." />
      <div className="grid gap-14 border-t border-ink/10 pt-10 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
        <dl className="space-y-7">
          {checkout.whatsapp && (
            <div>
              <dt className="label text-muted">WhatsApp</dt>
              <dd className="mt-2 font-serif text-3xl">
                <a href={whatsAppChatUrl(checkout.whatsapp, "Hello Revasser, I have a question.")} target="_blank" rel="noopener noreferrer">0{checkout.whatsapp.slice(3)}</a>
              </dd>
            </div>
          )}
          {footer.supportEmail && (
            <div>
              <dt className="label text-muted">Email</dt>
              <dd className="mt-2 break-all font-serif text-2xl"><a href={`mailto:${footer.supportEmail}`}>{footer.supportEmail}</a></dd>
            </div>
          )}
          {footer.socials.length > 0 && (
            <div>
              <dt className="label text-muted">Follow</dt>
              <dd className="mt-1 flex gap-5">
                {footer.socials.map((s) => <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="link-line"><span>{s.name}</span></a>)}
              </dd>
            </div>
          )}
        </dl>
        <ContactForm />
      </div>
    </div>
  );
}
