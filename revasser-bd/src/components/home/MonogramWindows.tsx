"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Photo } from "../ui/Photo";

export interface Door { href: string; name: string; text: string; image: string }

// The Revasser mark at full size: its four arms hold four windows, one per collection.
// All numbers share the drawing's units, with 0,0 at the centre of the mark.
const EXTENT = 180;
const RADIUS = 63.5;
const WINDOWS = [[0, -65.5], [65.5, 0], [0, 65.5], [-65.5, 0]];
const ARM = "M-174 35L0-139C22-161 42-163 61-163C103-163 129-128 127-74";
const ARM_ENDS = "M-178.8 33.4L-173.4 38.8L-155.2 17.4L-156.4 16.2Z M125.4-96L127.2-96L131.3-70L122.9-70Z";
const percent = (n: number) => `${(n / (EXTENT * 2)) * 100}%`;

export function MonogramWindows({ title, text, doors }: { title: string; text: string; doors: Door[] }) {
  const [active, setActive] = useState<number | null>(null);
  const point = (i: number | null) => ({ onPointerEnter: () => setActive(i), onPointerLeave: () => setActive(null) });

  return (
    <section data-monogram className="overflow-hidden bg-ink text-page">
      <div className="shell grid items-center gap-x-8 gap-y-4 py-9 sm:grid-cols-2 sm:py-11 lg:grid-cols-12 lg:py-[min(3.5rem,4svh)] [@media(max-height:620px)]:gap-y-2 [@media(max-height:620px)]:py-5">
        <div className="sm:col-span-2 lg:col-span-5 lg:self-end">
          <h2 className="display-md lg:text-[clamp(2.75rem,4.4vw,4.75rem)]">{title}</h2>
          {text && <p className="mt-2 max-w-sm text-sm text-page/70 sm:text-base">{text}</p>}
        </div>

        <div
          aria-hidden="true"
          className="relative mx-auto aspect-square w-[min(100%,22rem,41svh)] sm:w-[min(100%,26rem,58svh)] [@media(max-width:639px)_and_(max-height:620px)]:w-[min(100%,34svh)] lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:w-[min(100%,39rem,calc(100svh-14.5rem))]"
        >
          <svg viewBox={`${-EXTENT} ${-EXTENT} ${EXTENT * 2} ${EXTENT * 2}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            {WINDOWS.map((_, i) => (
              <g key={i} transform={`rotate(${i * 90})`} className={`text-accent transition-opacity duration-500 ${active === null || active === i ? "" : "opacity-30"}`}>
                <path d={ARM} pathLength={1} fill="none" stroke="currentColor" strokeWidth={active === i ? 2.6 : 1.5} className="arm-draw" />
                <path d={ARM_ENDS} fill="currentColor" />
              </g>
            ))}
          </svg>
          {doors.map((door, i) => (
            <Link
              key={door.href}
              href={door.href}
              tabIndex={-1}
              data-window
              {...point(i)}
              className="absolute overflow-hidden bg-campaign [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]"
              style={{
                left: percent(WINDOWS[i][0] - RADIUS + EXTENT),
                top: percent(WINDOWS[i][1] - RADIUS + EXTENT),
                width: percent(RADIUS * 2),
                height: percent(RADIUS * 2),
              }}
            >
              <Photo
                src={door.image}
                alt=""
                sizes="(min-width:1024px) 240px, 160px"
                className={`transition duration-1000 ease-silk ${active === i ? "scale-110" : active === null ? "" : "brightness-[.6]"}`}
              />
            </Link>
          ))}
        </div>

        <ul className="grid grid-cols-2 gap-x-4 border-b border-page/20 sm:block lg:col-span-5 lg:self-start">
          {doors.map((door, i) => (
            <li key={door.href} className="border-t border-page/20">
              <Link
                href={door.href}
                {...point(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={`flex h-full min-h-14 items-center gap-3 py-2.5 transition-colors duration-500 sm:min-h-[4.5rem] sm:gap-5 lg:[@media(max-height:800px)]:min-h-[3.75rem] lg:[@media(max-height:800px)]:py-1.5 ${active === i ? "text-accent" : ""}`}
              >
                {/* A small mark showing which window this is. */}
                <svg viewBox="-12 -12 24 24" className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden="true">
                  {WINDOWS.map(([x, y], n) => (
                    <path
                      key={n}
                      d="M0-4.6L4.6 0L0 4.6L-4.6 0Z"
                      transform={`translate(${(x / 65.5) * 5.8} ${(y / 65.5) * 5.8})`}
                      className={n === i ? "fill-accent" : "fill-none stroke-page/35"}
                    />
                  ))}
                </svg>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-[1.0625rem] leading-tight sm:text-2xl">{door.name}</span>
                  {door.text && <span className="mt-0.5 hidden text-sm leading-snug text-page/70 sm:block">{door.text}</span>}
                </span>
                <ArrowRight className={`hidden h-4 w-4 shrink-0 transition-transform duration-500 lg:block ${active === i ? "translate-x-1" : ""}`} strokeWidth={1} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
