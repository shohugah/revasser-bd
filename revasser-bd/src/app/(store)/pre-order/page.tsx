import Link from "next/link";
import { getContent } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { whatsAppChatUrl } from "@/lib/whatsapp";
import { Photo } from "@/components/ui/Photo";

export const metadata = pageMeta("Pre-order Pakistani fashion", "Pre-order original Pakistani dresses in Bangladesh. Choose the brand and the piece, and Revasser brings it to you.", "/pre-order", "/brand/editorial/preorder-olive-suit.jpg");

export default function PreOrderPage() {
  const { preorder: p, checkout } = getContent();
  return (
    <>
      <div className="grid bg-soft md:grid-cols-2">
        <div className="relative min-h-[26rem] md:order-2 md:min-h-[42rem]">
          <Photo src={p.image} alt="Editorial photograph of a woman in an embroidered suit" sizes="(min-width:768px) 50vw, 100vw" priority className="object-[50%_25%]" />
        </div>
        <div className="flex flex-col justify-center px-5 py-14 sm:px-10 lg:px-12 3xl:px-16">
          <p className="label text-campaign">{p.eyebrow}</p>
          <h1 className="display-lg mt-5">{p.title}</h1>
          <p className="mt-6 max-w-md text-muted">{p.text}</p>
          {checkout.whatsapp ? (
            <a href={whatsAppChatUrl(checkout.whatsapp, p.whatsappText)} target="_blank" rel="noopener noreferrer" className="btn-dark mt-8 self-start">Start a pre-order</a>
          ) : (
            <Link href="/contact" className="btn-dark mt-8 self-start">Start a pre-order</Link>
          )}
          {p.imageNote && <p className="mt-4 text-xs text-muted">{p.imageNote}</p>}
        </div>
      </div>
      <ol className="shell section grid gap-10 md:grid-cols-3">
        {p.steps.map((s, i) => (
          <li key={i} className="border-t border-ink/20 pt-6">
            <p className="font-serif text-4xl">{i + 1}</p>
            <h2 className="mt-5 text-3xl">{s.title}</h2>
            <p className="mt-3 max-w-sm text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
