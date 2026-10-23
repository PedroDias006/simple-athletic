import Image from "next/image";
import Link from "next/link";
import { categories, priceRanges, stores } from "@/data/catalog";
import { discountOf, formatPrice, savingsOf } from "@/lib/products";
import type { Product } from "@/types/product";
import { SectionTitle } from "./Brand";
import ExpiryBadge from "./ExpiryBadge";
import { ArrowRight } from "./Icons";
import { DiscountTag } from "./ProductCard";

/** Faixa preta com as ofertas passando, tipo letreiro de bolsa de valores. */
export function PriceTicker({ products }: { products: Product[] }) {
  if (!products.length) return null;
  const items = (hidden: boolean) =>
    products.map((p) => (
      <a
        key={`${p.id}-${hidden}`}
        href={`/ir/${p.id}`}
        target="_blank"
        rel="sponsored noopener"
        tabIndex={hidden ? -1 : undefined}
        className="flex shrink-0 items-center gap-3 px-6 font-display text-lg uppercase tracking-wide hover:text-white/70"
      >
        <span className="max-w-[18rem] truncate">{p.title}</span>
        <span>{formatPrice(p.price)}</span>
        <span className="text-[#ff7a5c]">-{discountOf(p)}%</span>
        <span aria-hidden className="ml-3 h-1.5 w-1.5 rotate-45 bg-white/40" />
      </a>
    ));

  return (
    <div className="marquee overflow-hidden bg-ink py-3.5 text-white" aria-label="Ofertas em destaque">
      <div className="marquee-track flex w-max">
        <div className="flex">{items(false)}</div>
        <div className="flex" aria-hidden>{items(true)}</div>
      </div>
    </div>
  );
}

/** Destaque grande da melhor oferta do momento. */
export function DealOfTheDay({ product }: { product: Product }) {
  const store = stores[product.store];
  const savings = savingsOf(product);
  return (
    <section className="grid overflow-hidden bg-snow lg:grid-cols-2">
      <div className="relative aspect-square lg:aspect-auto lg:min-h-[560px]">
        <Image src={product.imageUrl} alt={product.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-[14%] mix-blend-multiply" />
        <DiscountTag value={discountOf(product)} size="lg" className="absolute left-6 top-6 sm:left-8 sm:top-8" />
      </div>
      <div className="flex flex-col justify-center bg-white px-6 py-10 sm:px-12 lg:m-3 lg:px-14">
        <p className="flex items-center gap-3 text-sm font-medium">
          <span className="bg-ink px-2 py-1 text-xs uppercase tracking-wider text-white">Oferta do dia</span>
          {product.expiresAt && <ExpiryBadge expiresAt={product.expiresAt} />}
        </p>
        <h2 className="mt-5 text-2xl font-medium leading-tight sm:text-3xl">{product.title}</h2>
        <p className="mt-1 text-muted">{product.brand ? `${product.brand} · ` : ""}vendido por {store.name}</p>

        <div className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-1">
          <span className="font-display text-6xl leading-none sm:text-7xl">{formatPrice(product.price)}</span>
          {product.oldPrice && <span className="pb-1 text-lg text-muted line-through">{formatPrice(product.oldPrice)}</span>}
        </div>
        {savings > 0 && <p className="mt-2 text-lg font-medium text-deal">Você economiza {formatPrice(savings)}</p>}

        <ul className="mt-6 space-y-1.5 text-sm text-muted">
          {product.freeShipping && <li>✓ Frete grátis</li>}
          {product.coupon && <li>✓ Cupom <strong className="font-medium text-ink">{product.coupon}</strong> aplicado na loja</li>}
          <li>✓ Preço conferido pelo nosso robô; se subir, a oferta sai do ar</li>
        </ul>

        <a href={`/ir/${product.id}`} target="_blank" rel="sponsored noopener" className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-medium text-white transition hover:bg-black/70">
          Pegar oferta na {store.name} <ArrowRight width={18} height={18} />
        </a>
      </div>
    </section>
  );
}

/** "Quanto você quer gastar?" com contagem de ofertas em cada faixa. */
export function PriceRangeGrid({ products }: { products: Product[] }) {
  return (
    <section>
      <SectionTitle className="mb-4">Quanto você quer gastar?</SectionTitle>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {priceRanges.map((r) => {
          const n = products.filter((p) => p.price >= r.min && p.price <= r.max).length;
          return (
            <Link key={r.slug} href={`/ofertas?preco=${r.slug}`} className="group flex aspect-[4/3] flex-col justify-between bg-snow p-5 transition hover:bg-ink hover:text-white sm:p-7">
              <span className="text-sm text-muted group-hover:text-white/60">{n} {n === 1 ? "oferta" : "ofertas"}</span>
              <span className="flex items-end justify-between gap-2">
                <span className="font-display text-3xl uppercase leading-[0.95] sm:text-5xl">{r.label}</span>
                <ArrowRight className="mb-1 shrink-0 transition group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function BrandStrip({ brands }: { brands: { name: string; count: number }[] }) {
  if (!brands.length) return null;
  return (
    <section>
      <SectionTitle className="mb-4">Marcas em promoção</SectionTitle>
      {/* Só as marcas com mais ofertas, em pílulas pequenas, para a seção não virar uma parede de nomes. */}
      <ul className="flex flex-wrap gap-1.5">
        {[...brands].sort((a, b) => b.count - a.count).slice(0, 24).map((b) => (
          <li key={b.name}>
            <Link href={`/busca?q=${encodeURIComponent(b.name)}`} className="flex items-baseline gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium transition hover:border-ink">
              {b.name} <span className="text-xs text-muted">{b.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Links de busca por esporte, como o "mais buscados" das grandes lojas. */
export function PopularSearches() {
  return (
    <section>
      <SectionTitle>Mais buscados</SectionTitle>
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-4 lg:grid-cols-7">
        {categories.map((c) => (
          <div key={c.slug}>
            <Link href={`/${c.slug}`} className="font-medium hover:text-muted">{c.label}</Link>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {c.searches.map((s) => (
                <li key={s}><Link href={`/busca?q=${encodeURIComponent(s)}`} className="hover:text-ink">{s}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
