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

const tones: Record<Tone, { box: string; stripes: [string, string]; solid: string; outline: string; text: string }> = {
  ink: { box: "bg-ink text-white", stripes: ["bg-white", "bg-hot"], solid: "bg-white text-ink hover:bg-white/85", outline: "border-white/70 text-white hover:bg-white hover:text-ink", text: "text-white/80" },
  hot: { box: "bg-hot text-white", stripes: ["bg-ink", "bg-white"], solid: "bg-ink text-white hover:bg-black/75", outline: "border-white text-white hover:bg-white hover:text-ink", text: "text-white/90" },
  snow: { box: "bg-snow text-ink", stripes: ["bg-ink", "bg-hot"], solid: "bg-ink text-white hover:bg-black/75", outline: "border-ink text-ink hover:bg-ink hover:text-white", text: "text-muted" },
};

/**
 * Carrossel da home: fotos cortadas na diagonal pelas listras da marca, troca automática
 * com barrinhas de progresso, pausa ao passar o mouse e botão de pausar (acessibilidade).
 */
export default function HeroCarousel({ slides, maxDiscount }: { slides: HeroSlide[]; maxDiscount: number }) {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [stopped, setStopped] = useState(false);
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
        className="relative aspect-[9/14] overflow-hidden bg-ink sm:aspect-[5/4] lg:aspect-[2/1] xl:aspect-[21/9]"
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
            {s.layout === "diagonal" ? (
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
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="flex flex-1 gap-2">
          {slides.map((s, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`Ir para o slide ${i + 1}: ${s.title}`} aria-current={i === index} className="group h-6 flex-1">
              <span className="block h-[3px] overflow-hidden bg-line transition group-hover:bg-muted/40">
                {i < index && <span className="block h-full bg-ink" />}
                {i === index && (
                  <span
                    key={wipe}
                    className="hero-progress block h-full origin-left bg-hot"
                    style={{ animationDuration: `${DURACAO_MS}ms`, animationPlayState: hover || stopped ? "paused" : "running" }}
                    onAnimationEnd={next}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={() => setStopped((v) => !v)} aria-label={stopped ? "Continuar passando os slides" : "Pausar os slides"} className="grid h-10 w-10 place-items-center rounded-full bg-snow transition hover:bg-line">
            {stopped ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 4v16l13-8z" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
            )}
          </button>
          <button onClick={() => go(index - 1)} aria-label="Slide anterior" className="grid h-10 w-10 place-items-center rounded-full bg-snow transition hover:bg-line"><ChevronLeft /></button>
          <button onClick={() => go(index + 1)} aria-label="Próximo slide" className="grid h-10 w-10 place-items-center rounded-full bg-snow transition hover:bg-line"><ChevronRight /></button>
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
      <div className="absolute inset-x-0 bottom-0 flex h-[44%] flex-col justify-center px-5 sm:h-[40%] sm:px-10 lg:inset-y-0 lg:left-auto lg:h-full lg:w-[38%] lg:px-10 xl:px-14">
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
      <div className="absolute inset-0 flex flex-col justify-end p-5 pb-8 sm:p-10 lg:w-[52%] lg:justify-center lg:p-14">
        <SlideText slide={slide} tone="ink" first={first} active={active} maxDiscount={maxDiscount} onMode={onMode} />
      </div>
    </div>
  );
}

function SlideText({ slide, tone, first, active, maxDiscount, onMode }: SlideProps & { tone: Tone }) {
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
      <Title className="mt-3 font-display text-[2.6rem] uppercase leading-[0.92] sm:text-6xl lg:text-[3.6rem] xl:text-7xl">{slide.title}</Title>
      <p className={`mt-3 line-clamp-3 max-w-md text-sm sm:text-base ${t.text}`}>{slide.text}</p>
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
