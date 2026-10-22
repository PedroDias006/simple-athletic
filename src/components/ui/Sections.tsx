import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Category, Topic } from "@/data/catalog";
import type { Product } from "@/types/product";
import ProductCard from "./ProductCard";

export function ProductGrid({ products, wide = false }: { products: Product[]; wide?: boolean }) {
  return (
    <div className={`grid grid-cols-2 gap-x-2 gap-y-10 sm:gap-x-3 ${wide ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 2} />
      ))}
    </div>
  );
}

/** Bloco de foto com etiqueta branca, como os "Compre por esporte" das lojas oficiais. */
export function CategoryTile({ category, sizes = "(max-width: 640px) 72vw, 33vw", className = "aspect-[4/5]" }: { category: Category; sizes?: string; className?: string }) {
  return (
    <Link href={`/${category.slug}`} className={`group relative block overflow-hidden bg-snow ${className}`}>
      <Image src={category.image} alt="" fill sizes={sizes} className="object-cover transition duration-700 group-hover:scale-[1.03]" />
      <span className="absolute bottom-6 left-6 rounded-full bg-white px-5 py-2 text-base font-medium transition group-hover:bg-snow sm:bottom-8 sm:left-8">
        {category.label}
      </span>
    </Link>
  );
}

/** Card de tipo de produto: foto, título e um texto curto explicando o que tem ali. */
export function TopicCard({ topic, count }: { topic: Topic; count?: number }) {
  return (
    <Link href={`/busca?tipo=${topic.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-snow">
        <Image src={topic.image} alt="" fill sizes="(max-width: 640px) 60vw, (max-width: 1024px) 35vw, 22vw" className="object-cover transition duration-700 group-hover:scale-[1.04]" />
      </div>
      <div className="pt-3">
        <p className="flex items-baseline justify-between gap-2 text-base font-medium sm:text-lg">
          {topic.label}
          {count ? <span className="shrink-0 text-sm font-normal text-muted">{count} {count === 1 ? "oferta" : "ofertas"}</span> : null}
        </p>
        <p className="mt-1 text-sm leading-snug text-muted">{topic.description}</p>
      </div>
    </Link>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="py-20 text-center">
      <p className="text-2xl font-medium">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-muted">{children}</div>}
    </div>
  );
}

/** Cabeçalho de listagem: trilha + título com contagem. */
export function PageHeader({ crumb, title, count, description }: { crumb?: string; title: string; count?: number; description?: string }) {
  return (
    <div className="pb-6 pt-6 sm:pt-8">
      {crumb && (
        <p className="mb-2 text-sm">
          <Link href="/" className="hover:text-muted">Início</Link> <span className="text-muted">/ {crumb}</span>
        </p>
      )}
      <h1 className="text-2xl font-medium sm:text-[28px]">
        {title}
        {count !== undefined && <span> ({count})</span>}
      </h1>
      {description && <p className="mt-1 max-w-2xl text-muted">{description}</p>}
    </div>
  );
}

/** Lista lateral de filtros (desktop) que vira uma fileira de pílulas no celular. */
export function FilterGroup({ title, items }: { title: string; items: { href: string; label: string; active: boolean }[] }) {
  return (
    <div className="border-line lg:border-b lg:py-5 lg:first:pt-0">
      <p className="mb-3 hidden font-medium lg:block">{title}</p>
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-2.5 lg:px-0">
        {items.map((it) => (
          <li key={it.href} className="shrink-0">
            <Link
              href={it.href}
              scroll={false}
              aria-current={it.active ? "page" : undefined}
              className={`block rounded-full border px-4 py-2 text-sm transition lg:rounded-none lg:border-0 lg:p-0 lg:text-base ${
                it.active ? "border-ink bg-ink text-white lg:bg-transparent lg:font-medium lg:text-ink" : "border-line hover:border-ink lg:text-ink lg:hover:text-muted"
              }`}
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Layout de listagem: filtros à esquerda (fixos ao rolar) e grade à direita. */
export function ListingLayout({ filters, children }: { filters: ReactNode; children: ReactNode }) {
  return (
    <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
      <aside className="mb-6 space-y-3 lg:sticky lg:top-24 lg:mb-0 lg:max-h-[calc(100vh-7rem)] lg:space-y-0 lg:self-start lg:overflow-y-auto">
        {filters}
      </aside>
      <div>{children}</div>
    </div>
  );
}
