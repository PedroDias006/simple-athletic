"use client";

import Link from "next/link";
import { Children, useRef, type ReactNode } from "react";
import { SectionTitle } from "./Brand";
import { ChevronLeft, ChevronRight } from "./Icons";

/** Carrossel horizontal no estilo das lojas de esporte: título, "Ver tudo" e setas. */
export default function Rail({ title, href, children, itemClassName = "w-[72%] sm:w-[44%] lg:w-[calc((100%-24px)/3)]" }: {
  title: string;
  href?: string;
  children: ReactNode;
  itemClassName?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.9, behavior: "smooth" });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <SectionTitle>{title}</SectionTitle>
        <div className="flex items-center gap-3">
          {href && <Link href={href} className="text-base font-medium hover:text-muted">Ver tudo</Link>}
          <div className="hidden gap-3 sm:flex">
            <button onClick={() => scroll(-1)} aria-label="Anterior" className="grid h-12 w-12 place-items-center rounded-full bg-snow transition hover:bg-line">
              <ChevronLeft />
            </button>
            <button onClick={() => scroll(1)} aria-label="Próximo" className="grid h-12 w-12 place-items-center rounded-full bg-snow transition hover:bg-line">
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
      <div ref={track} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0">
        {Children.map(children, (child) => <div className={`shrink-0 snap-start ${itemClassName}`}>{child}</div>)}
      </div>
    </section>
  );
}
