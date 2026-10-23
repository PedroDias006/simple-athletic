import Image from "next/image";
import { unsplash } from "@/data/catalog";
import { DiscountTag } from "./ProductCard";
import { ModeLinkButton } from "./ModeToggle";

export interface GenderSide {
  mode: "feminino" | "masculino";
  /** Ofertas ativas daquele lado e o maior desconto entre elas (dados reais do robô). */
  count: number;
  maxDiscount: number;
}

const sides = {
  feminino: {
    photo: unsplash("1788642082059-b77ff7b1b8c0", 1600),
    alt: "Atleta correndo contra o céu azul",
    position: "object-[50%_18%]",
    eyebrow: "Simple Athletic · Pra ela",
    title: "Ninguém segura ela. Nem o preço.",
    cta: "Comprar feminino",
  },
  masculino: {
    photo: unsplash("1776705865344-90040e059b04", 1600),
    alt: "Atleta na largada da pista de atletismo",
    position: "object-[50%_40%]",
    eyebrow: "Simple Athletic · Pra ele",
    title: "Largada na frente. Preço lá atrás.",
    cta: "Comprar masculino",
  },
} as const;

/**
 * Arte dupla Ela | Ele, no estilo das campanhas das grandes marcas: duas fotos grandes lado a lado,
 * separadas pelas listras preta e laranja da marca. Cada lado liga o modo e abre as ofertas.
 */
export default function GenderSplit({ data }: { data: GenderSide[] }) {
  return (
    <section aria-label="Pra ela e pra ele" className="relative grid gap-1 overflow-hidden sm:grid-cols-2 sm:gap-0">
      {data.map((d, i) => {
        const s = sides[d.mode];
        return (
          <div key={d.mode} className="group relative aspect-[4/5] overflow-hidden bg-ink text-white sm:aspect-auto sm:h-[560px] lg:h-[680px]">
            <Image src={s.photo} alt={s.alt} fill sizes="(max-width: 640px) 100vw, 50vw" className={`object-cover ${s.position} transition duration-[1500ms] ease-out group-hover:scale-105`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            {d.count > 0 && (
              <p className={`absolute top-5 flex items-center gap-2 bg-white px-3 py-1.5 text-sm font-semibold text-ink sm:top-7 ${i === 0 ? "left-5 sm:left-8" : "right-5 sm:right-8"}`}>
                {d.count.toLocaleString("pt-BR")} ofertas
                {d.maxDiscount > 0 && <><span className="text-muted">·</span> até <DiscountTag value={d.maxDiscount} /></>}
              </p>
            )}
            <div className={`absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-12 ${i === 0 ? "sm:pr-16" : "sm:pl-16"}`}>
              <p className="text-sm font-medium text-white/85">{s.eyebrow}</p>
              <h2 className="mt-2 max-w-xl font-display text-4xl uppercase leading-[0.95] sm:text-5xl lg:text-6xl">{s.title}</h2>
              <ModeLinkButton mode={d.mode} href="/ofertas" className="mt-5 inline-flex rounded-full bg-white px-7 py-3 font-semibold text-ink transition hover:bg-hot hover:text-white">
                {s.cta}
              </ModeLinkButton>
            </div>
          </div>
        );
      })}
      {/* As duas listras da marca costurando as duas fotos (no PC). */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-1/2 gap-2.5 sm:flex">
        <span className="h-full w-3 -skew-x-[8deg] bg-ink" />
        <span className="h-full w-3 -skew-x-[8deg] bg-hot" />
      </div>
    </section>
  );
}
