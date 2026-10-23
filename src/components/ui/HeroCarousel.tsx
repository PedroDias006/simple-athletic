"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { HeroSlide } from "@/data/catalog";
import { Stripes } from "./Brand";
import { ChevronLeft, ChevronRight } from "./Icons";
import { useModeSwitch } from "./ModeToggle";

/** Tempo de cada slide (a barrinha de progresso usa o mesmo valor). */
const DURACAO_MS = 7000;

type Tone = "ink" | "hot" | "snow";

/** Oferta real mostrada no slide "Achados do dia" (só os campos que o card usa). */
export interface HeroDeal {
  id: string;
  title: string;
  store: string;
  price: number;
  oldPrice: number;
  imageUrl: string;
  updatedAt: string;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const checkedAt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

const tones: Record<Tone, { box: string; stripes: [string, string]; solid: string; outline: string; text: string }> = {
  ink: { box: "bg-ink text-white", stripes: ["bg-white", "bg-hot"], solid: "bg-white text-ink hover:bg-white/85", outline: "border-white/70 text-white hover:bg-white hover:text-ink", text: "text-white/80" },
  hot: { box: "bg-hot text-white", stripes: ["bg-ink", "bg-white"], solid: "bg-ink text-white hover:bg-black/75", outline: "border-white text-white hover:bg-white hover:text-ink", text: "text-white/90" },
  snow: { box: "bg-snow text-ink", stripes: ["bg-ink", "bg-hot"], solid: "bg-ink text-white hover:bg-black/75", outline: "border-ink text-ink hover:bg-ink hover:text-white", text: "text-muted" },
};

/**
 * Carrossel da home: fotos cortadas na diagonal pelas listras da marca, troca automática
 * com linha de progresso no pé do card, setas nos cantos e pausa ao passar o mouse ou focar.
 */
export default function HeroCarousel({ slides, deals, maxDiscount }: { slides: HeroSlide[]; deals: HeroDeal[]; maxDiscount: number }) {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [wipe, setWipe] = useState(0);
  const touchX = useRef<number | null>(null);
  const { choose } = useModeSwitch();
  const n = slides.length;

  const go = (to: number) => {
    setIndex(((to % n) + n) % n);
    setWipe((w) => w + 1);
  };
  const next = () => {
    // Quem pediu menos movimento no sistema troca de slide só pelos botões.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    go(index + 1);
  };

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={() => setHover(false)}
    >
      <div
        className="relative aspect-[9/14] overflow-hidden bg-ink sm:aspect-[16/11] lg:aspect-auto lg:h-[420px] xl:h-[460px] 2xl:h-[500px]"
        onPointerDown={(e) => { if (e.pointerType === "touch") touchX.current = e.clientX; }}
        onPointerUp={(e) => {
          if (touchX.current === null) return;
          const dx = e.clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        {slides.map((s, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${n}`}
            aria-hidden={i !== index}
            inert={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "z-10 opacity-100" : "opacity-0"}`}
          >
            {s.layout === "ofertas" ? (
              <DealsSlide slide={s} deals={deals} first={i === 0} active={i === index} maxDiscount={maxDiscount} onMode={choose} />
            ) : s.layout === "diagonal" ? (
              <DiagonalSlide slide={s} first={i === 0} active={i === index} maxDiscount={maxDiscount} onMode={choose} />
            ) : (
              <PhotoSlide slide={s} first={i === 0} active={i === index} maxDiscount={maxDiscount} onMode={choose} />
            )}
          </div>
        ))}

        {/* As duas listras atravessam a tela na troca de slide. */}
        {wipe > 0 && (
          <div key={wipe} aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            <div className="hero-wipe absolute inset-y-0 flex w-[40%] gap-[4%]" style={{ left: "-70%" }}>
              <span className="h-full flex-1 -skew-x-[18deg] bg-ink" />
              <span className="h-full flex-1 -skew-x-[18deg] bg-hot" />
            </div>
          </div>
        )}

        {/* Setas nos dois cantos do card. */}
        <button onClick={() => go(index - 1)} aria-label="Slide anterior" className="absolute left-3 top-[28%] z-30 sm:top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-sm transition hover:bg-white sm:left-4">
          <ChevronLeft />
        </button>
        <button onClick={() => go(index + 1)} aria-label="Próximo slide" className="absolute right-3 top-[28%] z-30 sm:top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-sm transition hover:bg-white sm:right-4">
          <ChevronRight />
        </button>

        {/* Linha de progresso contínua no pé do card: um trecho por slide, sem espaço entre eles. */}
        <div className="absolute inset-x-0 bottom-0 z-30 flex">
          {slides.map((s, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`Ir para o slide ${i + 1}: ${s.title}`} aria-current={i === index} className="flex h-4 flex-1 items-end">
              <span className="block h-1 w-full overflow-hidden bg-white/40">
                {i < index && <span className="block h-full bg-ink" />}
                {i === index && (
                  <span
                    key={wipe}
                    className="hero-progress block h-full origin-left bg-hot"
                    style={{ animationDuration: `${DURACAO_MS}ms`, animationPlayState: hover ? "paused" : "running" }}
                    onAnimationEnd={next}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

interface SlideProps {
  slide: HeroSlide;
  first: boolean;
  active: boolean;
  maxDiscount: number;
  onMode: (mode: "feminino" | "masculino") => void;
}

/** Duas fotos separadas pelas listras preta e laranja, com o painel de texto ao lado (ou embaixo, no celular). */
function DiagonalSlide({ slide, first, active, maxDiscount, onMode }: SlideProps) {
  const tone = slide.panel ?? "ink";
  const [a, b = a] = slide.photos;
  return (
    <div className={`absolute inset-0 ${tones[tone].box}`}>
      <div className="absolute inset-x-0 top-0 h-[56%] sm:h-[60%] lg:inset-y-0 lg:right-auto lg:h-full lg:w-[64%]">
        {/* Cada foto ocupa só a sua metade, para o recorte diagonal não esconder a pessoa. */}
        <div className="absolute inset-0 [clip-path:polygon(0_0,52%_0,40%_100%,0_100%)]">
          <div className="absolute inset-y-0 left-0 w-[54%]">
            <Image src={a} alt={slide.alt} fill priority={first} sizes="(max-width: 1024px) 55vw, 35vw" className="object-cover object-[70%_50%]" />
          </div>
        </div>
        <div className="absolute inset-0 bg-ink [clip-path:polygon(53%_0,56%_0,44%_100%,41%_100%)]" />
        <div className="absolute inset-0 bg-hot [clip-path:polygon(57%_0,60%_0,48%_100%,45%_100%)]" />
        <div className="absolute inset-0 [clip-path:polygon(61%_0,100%_0,100%_100%,49%_100%)] lg:[clip-path:polygon(61%_0,100%_0,88%_100%,49%_100%)]">
          <div className="absolute inset-y-0 right-0 w-[53%]">
            <Image src={b} alt="" fill priority={first} sizes="(max-width: 1024px) 55vw, 35vw" className="object-cover" />
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-[44%] flex-col justify-center px-5 sm:h-[40%] sm:px-10 lg:inset-y-0 lg:left-auto lg:h-full lg:w-[38%] lg:pl-10 lg:pr-20 xl:pl-14">
        <SlideText slide={slide} tone={tone} first={first} active={active} maxDiscount={maxDiscount} onMode={onMode} />
      </div>
    </div>
  );
}

/** Uma foto cheia com o texto por cima, escurecida do lado do texto. */
function PhotoSlide({ slide, first, active, maxDiscount, onMode }: SlideProps) {
  return (
    <div className="absolute inset-0 bg-ink text-white">
      <Image src={slide.photos[0]} alt={slide.alt} fill priority={first} sizes="100vw" className="object-cover object-[50%_35%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent lg:bg-gradient-to-r lg:from-black/80 lg:via-black/35" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 pb-8 sm:p-10 lg:w-[52%] lg:justify-center lg:p-14 lg:pl-24">
        <SlideText slide={slide} tone="ink" first={first} active={active} maxDiscount={maxDiscount} onMode={onMode} />
      </div>
    </div>
  );
}

/**
 * Os maiores descontos do site, com a foto, o preço e a loja que o robô trouxe.
 * Nada inventado: se não houver ofertas, o slide nem entra no carrossel.
 */
function DealsSlide({ slide, deals, first, active, maxDiscount, onMode }: SlideProps & { deals: HeroDeal[] }) {
  const newest = deals.reduce((m, d) => (d.updatedAt > m ? d.updatedAt : m), "");
  // Monta "dd/mm às hh:mm" pelas partes, para servidor e navegador escreverem igual.
  const part = (type: string) => checkedAt.formatToParts(new Date(newest)).find((p) => p.type === type)?.value;
  const note = newest ? `Preços conferidos em ${part("day")}/${part("month")} às ${part("hour")}:${part("minute")}.` : undefined;
  return (
    <div className="absolute inset-0 bg-snow">
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-ink lg:inset-y-0 lg:right-auto lg:h-full lg:w-[36%] lg:[clip-path:polygon(0_0,100%_0,88%_100%,0_100%)]" />
      {/* As listras acompanham o corte diagonal do painel (que vai de 36% no topo a ~32% embaixo). */}
      <div aria-hidden className="absolute inset-y-0 hidden lg:block" style={{ left: "30%", width: "10%" }}>
        <div className="absolute inset-0 bg-ink" style={{ clipPath: "polygon(64% 0, 76% 0, 33% 100%, 21% 100%)" }} />
        <div className="absolute inset-0 bg-hot" style={{ clipPath: "polygon(82% 0, 94% 0, 51% 100%, 39% 100%)" }} />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-[42%] flex-col justify-center px-5 text-white sm:px-10 lg:inset-y-0 lg:right-auto lg:h-full lg:w-[33%] lg:pl-24 lg:pr-6">
        <SlideText slide={slide} tone="ink" first={first} active={active} maxDiscount={maxDiscount} onMode={onMode} note={note} />
      </div>
      <ul className="absolute inset-x-0 top-0 grid h-[58%] grid-cols-2 gap-2 p-3 sm:gap-3 sm:p-5 lg:inset-y-0 lg:left-[41%] lg:right-0 lg:h-full lg:grid-cols-4 lg:gap-4 lg:py-10 lg:pl-0 lg:pr-20">
        {deals.map((d, i) => (
          <li key={d.id} className="min-h-0">
            <a href={`/ir/${d.id}`} target="_blank" rel="sponsored noopener" className="group flex h-full flex-col bg-white p-2 transition hover:shadow-lg sm:p-3 lg:p-4">
              <div className="relative min-h-0 flex-1">
                <Image src={d.imageUrl} alt={d.title} fill priority={first || i < 2} sizes="(max-width: 1024px) 45vw, 15vw" className="object-contain mix-blend-multiply transition duration-500 group-hover:scale-[1.04]" />
                <span className="absolute left-0 top-0 inline-block -skew-x-12 bg-hot px-2 py-0.5 text-white">
                  <span className="block skew-x-12 font-display text-sm leading-none sm:text-lg">-{Math.round((1 - d.price / d.oldPrice) * 100)}%</span>
                </span>
              </div>
              <p className="mt-2 line-clamp-1 text-xs font-medium leading-snug sm:line-clamp-2 sm:text-sm">{d.title}</p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-semibold sm:text-lg">{brl.format(d.price)}</span>
                <span className="text-[11px] text-muted line-through sm:text-xs">{brl.format(d.oldPrice)}</span>
              </p>
              <p className="text-[11px] text-muted sm:text-xs">{d.store}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SlideText({ slide, tone, first, active, maxDiscount, onMode, note }: SlideProps & { tone: Tone; note?: string }) {
  const t = tones[tone];
  const Title = first ? "h1" : "h2";
  const eyebrow = slide.eyebrow === "desconto" ? (maxDiscount > 0 ? `Até -${maxDiscount}% hoje` : "Conferido de hora em hora") : slide.eyebrow;
  const btn = "inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold transition sm:text-base";

  return (
    <div className={`transition duration-700 ${active ? "translate-y-0 opacity-100 delay-200" : "translate-y-4 opacity-0"}`}>
      <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm">
        <Stripes className="h-[1.1em]" a={t.stripes[0]} b={t.stripes[1]} />
        {eyebrow}
      </p>
      <Title className="mt-3 font-display text-[2.6rem] uppercase leading-[0.92] sm:text-6xl lg:text-[3.4rem] xl:text-[4.2rem]">{slide.title}</Title>
      <p className={`mt-3 line-clamp-3 max-w-md text-sm sm:text-base ${t.text}`}>{slide.text}</p>
      {note && <p className={`mt-2 text-xs ${t.text}`}>{note}</p>}
      <div className="mt-5 flex flex-wrap gap-2.5">
        {slide.ctas.map((c, i) => {
          const cls = `${btn} ${i === 0 ? t.solid : `border ${t.outline}`}`;
          if (c.mode) return <button key={c.label} type="button" onClick={() => onMode(c.mode!)} className={cls}>{c.label}</button>;
          if (c.href?.startsWith("http")) return <a key={c.label} href={c.href} target="_blank" rel="noopener" className={cls}>{c.label}</a>;
          if (c.href?.startsWith("#")) return <a key={c.label} href={c.href} className={cls}>{c.label}</a>;
          return <Link key={c.label} href={c.href ?? "/"} className={cls}>{c.label}</Link>;
        })}
      </div>
    </div>
  );
}
