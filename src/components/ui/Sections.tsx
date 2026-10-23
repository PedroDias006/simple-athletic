import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { amazonSearchUrl, departmentLook, type Category, type Department, type Topic } from "@/data/catalog";
import type { Mode } from "@/lib/mode";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/products";
import { ArrowRight } from "./Icons";
import ProductCard, { DiscountTag } from "./ProductCard";

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

export const POR_PAGINA = 48;

/** Quantos produtos mostrar para ?pagina=N (a página N mostra os N*48 primeiros). */
export function paginaAtual(valor?: string) {
  const n = Math.floor(Number(valor));
  return Number.isFinite(n) && n > 1 ? Math.min(n, 100) : 1;
}

/** Botão "Ver mais" que carrega a próxima leva sem perder os filtros. */
export function LoadMore({ shown, total, href }: { shown: number; total: number; href: string }) {
  if (shown >= total) return null;
  return (
    <div className="mt-12 flex flex-col items-center gap-3">
      <p className="text-sm text-muted">Mostrando {shown} de {total}</p>
      <Link href={href} scroll={false} className="rounded-full border border-ink px-8 py-3 font-medium transition hover:bg-ink hover:text-white">
        Ver mais {Math.min(POR_PAGINA, total - shown)}
      </Link>
    </div>
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

/** Produto mostrado dentro do card de departamento (só o que o card precisa). */
export interface DepartmentDeal {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  discount: number;
}

/**
 * Card de departamento "vitrine": em vez de foto de banco, mostra a maior oferta real do
 * departamento em destaque, mais três ofertas em miniatura, o maior desconto e o menor preço.
 * Sem ofertas, volta para a foto do departamento.
 */
export function DepartmentDealsTile({ department, mode, count = 0, deals, minPrice, maxDiscount }: {
  department: Department;
  mode: Mode;
  count?: number;
  deals: DepartmentDeal[];
  minPrice?: number;
  maxDiscount: number;
}) {
  if (!deals.length) return <DepartmentTile department={department} mode={mode} count={count} className="aspect-[3/4.2]" />;
  const [main, ...rest] = deals;
  return (
    <Link href={`/${department.slug}`} className="group relative flex h-full flex-col overflow-hidden bg-snow transition hover:shadow-xl">
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <div className="min-w-0">
          <p className="truncate font-display text-[1.65rem] uppercase leading-none">{department.slug === "lesao-e-recuperacao" ? "Recuperação" : department.label}</p>
          <p className="mt-1 text-xs text-muted">{count.toLocaleString("pt-BR")} {count === 1 ? "oferta" : "ofertas"}</p>
        </div>
        {maxDiscount > 0 && (
          <span className="flex shrink-0 flex-col items-end">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">até</span>
            <DiscountTag value={maxDiscount} />
          </span>
        )}
      </div>

      {/* Destaque: a maior oferta do departamento, num "palco" branco inclinado como as listras. */}
      <div className="relative mx-4 mt-3 h-40 sm:h-44">
        <span aria-hidden className="absolute inset-y-1 left-[14%] right-[14%] -skew-x-[12deg] bg-white transition duration-500 group-hover:bg-hot/10" />
        <Image src={main.imageUrl} alt={main.title} fill sizes="(max-width: 640px) 60vw, 20vw" className="object-contain p-3 mix-blend-multiply transition duration-500 group-hover:scale-[1.06]" />
        <span className="absolute bottom-0 right-0 bg-ink px-2 py-1 text-xs font-semibold text-white">{formatPrice(main.price)}</span>
      </div>

      {rest.length > 0 && (
        <ul className="mx-4 mt-3 grid grid-cols-3 gap-1.5">
          {rest.map((d) => (
            <li key={d.id} className="bg-white">
              <div className="relative aspect-square">
                <Image src={d.imageUrl} alt="" fill sizes="80px" className="object-contain p-1.5 mix-blend-multiply" />
                <span className="absolute left-0 top-0 bg-hot px-1 text-[10px] font-semibold leading-4 text-white">-{d.discount}%</span>
              </div>
              <p className="truncate px-1 pb-1 text-center text-[11px] font-semibold">{formatPrice(d.price)}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between bg-ink px-4 py-3 text-white transition group-hover:bg-hot">
          <span className="leading-tight">
            {minPrice ? (
              <>
                <span className="block text-[11px] text-white/70">A partir de</span>
                <span className="text-base font-semibold">{formatPrice(minPrice)}</span>
              </>
            ) : (
              <span className="text-sm font-semibold">Ver ofertas</span>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            Ver tudo <ArrowRight width={18} height={18} className="transition group-hover:translate-x-1" />
          </span>
        </div>
      </div>
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
