import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Content } from "@/lib/content";
import { whatsAppChatUrl } from "@/lib/whatsapp";
import { Photo } from "../ui/Photo";
import { BENEFIT_ICONS } from "../ui/icons";
import { ProductCard } from "../shop/ProductCard";
import { MonogramWindows } from "./MonogramWindows";

type Props = { content: Content };

function Hero({ content: { banner: b } }: Props) {
  return (
    <section className="relative bg-campaign text-page lg:grid lg:h-[clamp(34rem,calc(100svh-10.3rem),62rem)] lg:grid-cols-12">
      <div className="hero-settle relative h-[54svh] min-h-[20rem] overflow-hidden sm:h-[62svh] lg:order-2 lg:col-span-7 lg:h-full lg:min-h-0">
        {b.mobileImage && (
          <picture>
            {b.image && <source media="(min-width: 640px)" srcSet={optimised(b.image, [1080, 1920, 2048])} sizes="(min-width:1024px) 59vw, 100vw" />}
            <img
              src={optimised(b.mobileImage, [1080]).split(" ")[0]}
              srcSet={optimised(b.mobileImage, [640, 828, 1080])}
              sizes="100vw"
              alt={b.photoDescription}
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-[50%_62%] sm:object-[46%_42%]"
            />
          </picture>
        )}
      </div>
      <div className="relative z-10 flex flex-col px-5 pb-12 sm:px-8 sm:pb-16 lg:order-1 lg:col-span-5 lg:h-full lg:justify-between lg:gap-5 lg:pl-[max(3rem,calc((100vw-1760px)/2+4rem))] lg:pr-8 lg:py-[min(3.5rem,5svh)]">
        {b.tagline && <p className="label hidden max-w-[18rem] lg:[@media(max-height:620px)]:hidden leading-relaxed text-accent lg:block">{b.tagline}</p>}
        <h1 className="display-xl -mt-[0.72em] lg:mt-0 lg:w-max lg:pb-[0.08em] lg:text-[min(8vw,12.6svh,8.75rem)]">
          <span className="block">{b.titleStart}</span>{" "}
          <span className="block italic">{b.titleHighlight}</span>{" "}
          <span className="block">{b.titleEnd}</span>
        </h1>
        <div>
          <p className="mt-6 max-w-sm text-page/75 lg:mt-0 lg:text-lg">{b.text}</p>
          <div className="mt-7 flex flex-col items-start gap-3 lg:mt-[min(1.75rem,3svh)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            {b.primaryButton && <Link href={b.primaryLink} className="btn-light lg:px-6 lg:tracking-[0.16em]">{b.primaryButton}</Link>}
            {b.secondButton && <Link href={b.secondLink} className="link-line lg:tracking-[0.13em]"><span>{b.secondButton}</span></Link>}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A srcset through the image optimiser, for the art-directed hero. Outside addresses are used as they are. */
function optimised(src: string, widths: number[]) {
  if (/^https?:/.test(src)) return src;
  return widths.map((w) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=72 ${w}w`).join(", ");
}

function Collections({ content: { collections, headings, products } }: Props) {
  const doors = collections
    .filter((c) => c.featured)
    .slice(0, 4)
    .map((c) => ({ href: `/shop/${c.slug}`, name: c.name, text: c.description, image: c.image }));
  if (!doors.length) return null;
  // The mark has four windows. With fewer collections, the newest pieces take the next one.
  const fresh = products.filter((p) => p.isNew);
  // The second piece, so the window does not repeat the first card of the row below.
  const newest = fresh[1] ?? fresh[0];
  if (doors.length < 4 && newest) {
    doors.push({ href: "/shop/new-arrivals", name: "New Arrivals", text: "The latest pieces in the shop.", image: newest.images[0] });
  }
  return <MonogramWindows title={headings.collectionsTitle} text={headings.collectionsText} doors={doors} />;
}

function Edit({ title, text, href, products, viewAll }: { title: string; text: string; href: string; products: Content["products"]; viewAll: string }) {
  if (!products.length) return null;
  return (
    <section className="border-t border-ink/10">
      <div className="shell section">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 lg:mb-14">
          <div>
            <h2 className="display-lg">{title}</h2>
            {text && <p className="mt-4 max-w-md text-muted">{text}</p>}
          </div>
          <Link href={href} className="link-line"><span>{viewAll}</span></Link>
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
          {products.slice(0, 4).map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
        </ul>
      </div>
    </section>
  );
}

const NewIn = ({ content: c }: Props) => (
  <Edit title={c.headings.newTitle} text={c.headings.newText} href="/shop/new-arrivals" products={c.products.filter((p) => p.isNew)} viewAll={c.headings.viewAll} />
);
const BestSellers = ({ content: c }: Props) => (
  <Edit title={c.headings.bestTitle} text={c.headings.bestText} href="/shop/best-sellers" products={c.products.filter((p) => p.bestSeller)} viewAll={c.headings.viewAll} />
);

function Campaign({ content: { campaign: c } }: Props) {
  const lines = [c.line1, c.line2, c.line3];
  // The three lines step down the page like someone walking through a shop.
  const step = ["lg:mt-0", "lg:mt-40", "lg:mt-80"];
  return (
    <section className="overflow-hidden bg-ink text-page">
      <div className="shell section">
        <h2 className="sr-only">{lines.join(" ")}</h2>
        <ol className="grid gap-y-12 lg:grid-cols-3 lg:gap-x-6">
          {lines.map((line, i) => (
            <li key={i} className={`${step[i]} ${i === 1 ? "pl-[18%] lg:pl-0" : "pr-[18%] lg:pr-0"}`}>
              {c.photos[i] && (
                <div className="reveal relative aspect-[4/5] overflow-hidden bg-campaign">
                  <Photo src={c.photos[i].src} alt={c.photos[i].alt} sizes="(min-width:1024px) 32vw, 82vw" />
                </div>
              )}
              <p aria-hidden="true" className={`relative -mt-[0.5em] pl-3 font-serif text-[clamp(3.25rem,6.6vw,7.5rem)] leading-none ${i === 2 ? "whitespace-nowrap italic" : ""}`}>
                {line}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-14 max-w-md lg:-mt-44 lg:pb-4">
          <p className="text-page/75">{c.text}</p>
          {c.button && <Link href={c.href} className="btn-line-light mt-7">{c.button}</Link>}
        </div>
      </div>
    </section>
  );
}

function PreOrder({ content: { preorder: p } }: Props) {
  return (
    <section className="bg-soft">
      <div className="shell section grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="relative lg:col-span-6">
          <div className="reveal relative aspect-[3/4] w-[70%] overflow-hidden bg-page">
            <Photo src={p.image} alt="Editorial photograph of a woman in an embroidered suit" sizes="(min-width:1024px) 34vw, 70vw" />
          </div>
          {p.secondImage && (
            <div className="absolute bottom-10 right-0 aspect-[3/4] w-[40%] overflow-hidden bg-page">
              <Photo src={p.secondImage} alt="Editorial photograph of an embroidered dress with a shawl" sizes="(min-width:1024px) 20vw, 40vw" />
            </div>
          )}
          {p.imageNote && <p className="mt-3 text-xs text-muted">{p.imageNote}</p>}
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <p className="label text-campaign">{p.eyebrow}</p>
          <h2 className="display-lg mt-5">{p.title}</h2>
          <p className="mt-6 max-w-md text-muted">{p.text}</p>
          <ol className="mt-9 max-w-md">
            {p.steps.map((s, i) => (
              <li key={i} className="flex items-baseline gap-6 border-t border-ink/15 py-3.5">
                <span className="w-4 font-serif text-xl">{i + 1}</span>
                <span className="text-lg">{s.title}</span>
              </li>
            ))}
          </ol>
          {p.button && <Link href="/pre-order" className="btn-dark mt-8">{p.button}</Link>}
        </div>
      </div>
    </section>
  );
}

function Categories({ content: { categories, headings } }: Props) {
  const shown = categories.filter((c) => c.featured);
  if (!shown.length) return null;
  return (
    <section className="shell section">
      <div className="grid gap-9 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <h2 className="display-lg">{headings.categoriesTitle}</h2>
          <p className="label mt-5 text-muted">{headings.categoriesText}</p>
        </div>
        <ul className="border-b border-ink/15 lg:col-span-8">
          {shown.map((c) => (
            <li key={c.id} className="border-t border-ink/15">
              <Link href={`/shop/${c.slug}`} className="group flex items-center gap-4 py-3 sm:gap-8">
                <span className="relative h-20 w-20 shrink-0 overflow-hidden bg-soft transition-[width] duration-700 ease-silk sm:h-28 sm:w-28 sm:group-hover:w-44">
                  <Photo src={c.image} alt="" sizes="176px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-2xl leading-tight sm:text-4xl">{c.name}</span>
                  {c.countLabel && <span className="text-xs text-muted">{c.countLabel}</span>}
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-500 group-hover:translate-x-1" strokeWidth={1} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Blocks({ content: { blocks } }: Props) {
  return blocks.map((block, i) => (
    <section key={i} className="border-t border-ink/10">
      <div className={`shell section grid items-center gap-10 ${block.src ? "md:grid-cols-2" : ""}`}>
        {block.src && <div className="relative aspect-[4/3] overflow-hidden bg-soft"><Photo src={block.src} alt={block.title} sizes="(min-width:768px) 48vw, 100vw" /></div>}
        <div>
          <h2 className="display-md">{block.title}</h2>
          <p className="mt-5 max-w-lg whitespace-pre-line text-muted">{block.text}</p>
          {block.button && block.href && <Link href={block.href} className="btn-dark mt-7">{block.button}</Link>}
        </div>
      </div>
    </section>
  ));
}

function Story({ content: { story: s } }: Props) {
  return (
    <section className="grid bg-campaign text-page md:grid-cols-2">
      <div className="relative min-h-[26rem] md:min-h-[40rem] lg:min-h-[50rem]">
        <Photo src={s.image} alt={s.photoDescription} sizes="(min-width:768px) 50vw, 100vw" />
      </div>
      <div className="flex flex-col justify-center px-5 py-16 sm:px-12 lg:px-24">
        <p className="label text-accent">{s.eyebrow}</p>
        <h2 className="display-lg mt-5 max-w-xl">{s.title}</h2>
        <p className="mt-6 max-w-md text-page/75">{s.text.split("\n\n")[0]}</p>
        {s.button && <Link href="/about" className="btn-line-light mt-8 self-start">{s.button}</Link>}
      </div>
    </section>
  );
}

function Reviews({ content: { reviews, headings } }: Props) {
  if (!reviews.length) return null;
  return (
    <section className="shell section">
      <h2 className="display-lg">{headings.reviewsTitle}</h2>
      <ul className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-3">
        {reviews.slice(0, 3).map((r, i) => (
          <li key={i}>
            <figure>
              <blockquote className="font-serif text-2xl leading-snug">“{r.text}”</blockquote>
              <figcaption className="label mt-5 text-muted">{r.name}{r.source && `, ${r.source}`}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Social({ content: { social, footer } }: Props) {
  if (!social.items.length) return null;
  const instagram = footer.socials.find((s) => s.name === "Instagram")?.url;
  return (
    <section className="shell py-20 lg:py-28">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="display-md">
          {instagram ? <a href={instagram} target="_blank" rel="noopener noreferrer">{social.title}</a> : social.title}
        </h2>
        <p className="label text-muted">{social.text}</p>
      </div>
      <ul className="grid grid-cols-2 gap-1.5 sm:gap-3 lg:grid-cols-4">
        {social.items.slice(0, 8).map((item, i) => (
          <li key={i}>
            <a href={item.href || instagram} target="_blank" rel="noopener noreferrer" aria-label={`${item.alt}, opens the original post`} className="group relative block aspect-square overflow-hidden bg-soft">
              <Photo src={item.src} alt="" sizes="(min-width:1024px) 24vw, 50vw" className="transition-transform duration-1000 ease-silk group-hover:scale-[1.03]" />
              <ArrowUpRight className="absolute bottom-3 right-3 h-5 w-5 text-page opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={1.25} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Benefits({ content: { benefits } }: Props) {
  if (!benefits.length) return null;
  return (
    <section aria-label="Shopping with Revasser" className="border-t border-ink/10">
      <ul className="shell grid grid-cols-2 gap-x-5 gap-y-9 py-12 lg:grid-cols-4">
        {benefits.map((item, i) => {
          const Icon = BENEFIT_ICONS[item.icon as keyof typeof BENEFIT_ICONS] || BENEFIT_ICONS.Check;
          return (
            <li key={i}>
              <Icon className="h-5 w-5" strokeWidth={1.1} />
              <p className="mt-4 text-xs uppercase tracking-[0.16em]">{item.title}</p>
              <p className="mt-2 text-sm leading-snug text-muted">{item.text}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Join({ content: { join, checkout } }: Props) {
  if (!checkout.whatsapp || !join.title) return null;
  return (
    <section className="bg-soft">
      <div className="shell flex flex-col items-center gap-8 py-16 text-center lg:flex-row lg:justify-between lg:py-20 lg:text-left">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:gap-10">
          <img src="/brand/logo/mark-ink.png" alt="" loading="lazy" className="h-20 w-20" />
          <div>
            <h2 className="display-md">{join.title}</h2>
            <p className="mt-3 max-w-md text-muted">{join.text}</p>
          </div>
        </div>
        <a href={whatsAppChatUrl(checkout.whatsapp, join.message)} target="_blank" rel="noopener noreferrer" className="btn-dark">{join.button}</a>
      </div>
    </section>
  );
}

/** The keys are the section names offered in the editor. */
export const SECTIONS: Record<string, React.ComponentType<Props>> = {
  Hero,
  Collections,
  "New in": NewIn,
  Campaign,
  "Pre-order": PreOrder,
  Categories,
  "Best sellers": BestSellers,
  "Extra blocks": Blocks,
  Story,
  Reviews,
  Social,
  Benefits,
  Join,
};
