import Link from "next/link";
import { getContent } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { Photo } from "@/components/ui/Photo";

export const metadata = pageMeta("Our story", "Revasser began in Dhaka with jewellery and is growing into fashion and lifestyle, one order at a time.", "/about");

export default function AboutPage() {
  const { story: s } = getContent();
  return (
    <>
      <div className="grid md:grid-cols-2">
        <div className="relative min-h-[24rem] md:min-h-[44rem]">
          <Photo src={s.image} alt={s.photoDescription} sizes="(min-width:768px) 50vw, 100vw" priority />
        </div>
        <div className="flex flex-col justify-center bg-campaign px-5 py-14 text-page sm:px-12 lg:px-24">
          <p className="label text-accent">{s.eyebrow}</p>
          <h1 className="display-lg mt-5">{s.title}</h1>
          <div className="mt-7 max-w-lg space-y-4 text-page/75">
            {s.text.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
          </div>
          <Link href="/shop" className="btn-line-light mt-9 self-start">Explore the edit</Link>
        </div>
      </div>
    </>
  );
}
