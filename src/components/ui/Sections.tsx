import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { amazonSearchUrl, departmentLook, type Category, type Department, type Topic } from "@/data/catalog";
import type { Mode } from "@/lib/mode";
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

/** Atalho para a busca da Amazon com a nossa tag de associado (sem preço, só o link). */
export function AmazonSearch({ term, label }: { term: string; label: string }) {
  return (
    <a
      href={amazonSearchUrl(term)}
      target="_blank"
      rel="sponsored noopener"
      className="group mt-12 flex flex-col gap-4 rounded-2xl border border-line bg-snow p-6 transition hover:border-ink sm:flex-row sm:items-center sm:justify-between sm:p-8"
    >
      <span>
        <span className="block text-sm text-muted">Não achou o que queria?</span>
        <span className="mt-1 block text-lg font-medium sm:text-xl">Veja mais {label} na Amazon</span>
        <span className="mt-1 block text-sm text-muted">Abre a busca da Amazon. Os preços e descontos aparecem lá.</span>
      </span>
      <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-[#ff9900] px-6 py-3 font-medium text-black transition group-hover:bg-[#f08804]">
        Procurar na Amazon →
      </span>
    </a>
  );
}

/** Bloco grande de departamento (Calçados, Roupas...), com a foto do modo feminino/masculino. */
export function DepartmentTile({ department, mode, count, className = "aspect-[4/5]" }: { department: Department; mode: Mode; count?: number; className?: string }) {
  return (
    <Link href={`/${department.slug}`} className={`group relative block overflow-hidden bg-snow ${className}`}>
      <Image src={departmentLook(department, mode).image} alt="" fill sizes="(max-width: 640px) 72vw, 25vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
      <span className="absolute bottom-5 left-5 flex items-baseline gap-2 rounded-full bg-white px-5 py-2 text-base font-medium transition group-hover:bg-snow sm:bottom-7 sm:left-7">
        {department.label}
        {count ? <span className="text-sm font-normal text-muted">{count}</span> : null}
      </span>
    </Link>
  );
}

/** Card de tipo de produto: foto, título e um texto curto explicando o que tem ali. */
export function TopicCard({ topic, count }: { topic: Topic; count?: number }) {
  return (
    <Link href={topic.href} className="group block">
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
export interface FilterItem {
  href: string;
  label: string;
  active: boolean;
  /** Cor (ou gradiente) da bolinha mostrada antes do nome, nos filtros de cor. */
  swatch?: string;
  count?: number;
}

export function FilterGroup({ title, items }: { title: string; items: FilterItem[] }) {
  if (items.length < 2) return null;
  return (
    <div className="border-line lg:border-b lg:py-5 lg:first:pt-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted lg:mb-3 lg:text-base lg:normal-case lg:tracking-normal lg:text-ink">{title}</p>
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-2.5 lg:px-0">
        {items.map((it) => (
          <li key={it.href} className="shrink-0">
            <Link
              href={it.href}
              scroll={false}
              aria-current={it.active ? "page" : undefined}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition lg:rounded-none lg:border-0 lg:p-0 lg:text-base ${
                it.active ? "border-ink bg-ink text-white lg:bg-transparent lg:font-medium lg:text-ink" : "border-line hover:border-ink lg:text-ink lg:hover:text-muted"
              }`}
            >
              {it.swatch && (
                <span
                  aria-hidden
                  className={`h-4 w-4 shrink-0 rounded-full border border-black/15 ${it.active ? "ring-2 ring-hot ring-offset-1" : ""}`}
                  style={{ background: it.swatch }}
                />
              )}
              {it.label}
              {it.count !== undefined && <span className={`text-xs ${it.active ? "opacity-70" : "text-muted"}`}>{it.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Layout de listagem: no PC, filtros à esquerda (fixos ao rolar) e grade à direita.
 * No celular, os filtros ficam recolhidos num botão "Filtrar e ordenar", como na Nike.
 */
export function ListingLayout({ filters, children, activeFilters = 0 }: { filters: ReactNode; children: ReactNode; activeFilters?: number }) {
  return (
    <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
      <details className="group mb-6 lg:hidden">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-line px-5 py-2.5 font-medium transition hover:border-ink [&::-webkit-details-marker]:hidden">
          Filtrar e ordenar
          {activeFilters > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-xs text-white">{activeFilters}</span>}
          <span aria-hidden className="text-muted transition group-open:rotate-180">▾</span>
        </summary>
        <div className="mt-4 space-y-4 border-b border-line pb-6">{filters}</div>
      </details>
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
        {filters}
      </aside>
      <div>{children}</div>
    </div>
  );
}
