import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import { EmptyState, FilterGroup, ListingLayout, LoadMore, PageHeader, paginaAtual, POR_PAGINA, ProductGrid } from "@/components/ui/Sections";
import { priceRanges, stores, type PriceRangeSlug } from "@/data/catalog";
import { getMode } from "@/lib/mode";
import { discountOf, getActiveProducts, sortByDiscount } from "@/lib/products";
import type { StoreId } from "@/types/product";

export const metadata: Metadata = { title: "Todas as ofertas", description: "Todas as promoções esportivas ativas, atualizadas o dia todo." };

const orders = {
  desconto: "Maior desconto",
  menor: "Menor preço",
  maior: "Maior preço",
  expira: "Acabando logo",
} as const;
type Order = keyof typeof orders;

type Params = { ordem?: string; loja?: string; preco?: string; frete?: string; cupom?: string; pagina?: string };
type Props = { searchParams: Promise<Params> };

export default async function OffersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const order: Order = sp.ordem && sp.ordem in orders ? (sp.ordem as Order) : "desconto";
  const store = sp.loja && sp.loja in stores ? (sp.loja as StoreId) : undefined;
  const range = priceRanges.find((r) => r.slug === sp.preco);
  const freeShipping = sp.frete === "1";
  const withCoupon = sp.cupom === "1";

  const mode = await getMode();
  // Esta página é só de promoções; o catálogo completo fica nos departamentos.
  let list = getActiveProducts(mode).filter((p) => discountOf(p) > 0);
  if (store) list = list.filter((p) => p.store === store);
  if (range) list = list.filter((p) => p.price >= range.min && p.price <= range.max);
  if (freeShipping) list = list.filter((p) => p.freeShipping);
  if (withCoupon) list = list.filter((p) => p.coupon);
  if (order === "desconto") list = sortByDiscount(list);
  if (order === "menor") list = [...list].sort((a, b) => a.price - b.price);
  if (order === "maior") list = [...list].sort((a, b) => b.price - a.price);
  if (order === "expira") list = [...list].sort((a, b) => (a.expiresAt ? Date.parse(a.expiresAt) : Infinity) - (b.expiresAt ? Date.parse(b.expiresAt) : Infinity));

  const page = paginaAtual(sp.pagina);
  const shown = Math.min(list.length, page * POR_PAGINA);

  /** Monta o link mantendo os filtros atuais; null remove o filtro. */
  const href = (next: { [K in keyof Params]?: string | null }) => {
    const current: Params = { ordem: order === "desconto" ? undefined : order, loja: store, preco: range?.slug, frete: freeShipping ? "1" : undefined, cupom: withCoupon ? "1" : undefined, pagina: undefined };
    const q = new URLSearchParams();
    for (const key of Object.keys(current) as (keyof Params)[]) {
      const v = key in next ? next[key] : current[key];
      if (v && !(key === "ordem" && v === "desconto")) q.set(key, v);
    }
    const s = q.toString();
    return s ? `/ofertas?${s}` : "/ofertas";
  };

  const title = store ? `Ofertas ${stores[store].name}` : range ? `Ofertas ${range.label.charAt(0).toLowerCase()}${range.label.slice(1)}` : "Todas as ofertas";

  return (
    <Container>
      <PageHeader crumb="Ofertas" title={title} count={list.length} />
      <ListingLayout
        filters={
          <>
            <FilterGroup title="Ordenar por" items={(Object.keys(orders) as Order[]).map((o) => ({ href: href({ ordem: o }), label: orders[o], active: o === order }))} />
            <FilterGroup
              title="Preço"
              items={[
                { href: href({ preco: null }), label: "Qualquer preço", active: !range },
                ...priceRanges.map((r) => ({ href: href({ preco: r.slug as PriceRangeSlug }), label: r.label, active: range?.slug === r.slug })),
              ]}
            />
            <FilterGroup
              title="Vantagens"
              items={[
                { href: href({ frete: freeShipping ? null : "1" }), label: freeShipping ? "✓ Frete grátis" : "Frete grátis", active: freeShipping },
                { href: href({ cupom: withCoupon ? null : "1" }), label: withCoupon ? "✓ Com cupom" : "Com cupom", active: withCoupon },
              ]}
            />
            <FilterGroup
              title="Loja"
              items={[
                { href: href({ loja: null }), label: "Todas as lojas", active: !store },
                ...(Object.keys(stores) as StoreId[]).map((id) => ({ href: href({ loja: id }), label: stores[id].name, active: store === id })),
              ]}
            />
          </>
        }
      >
        {list.length ? (
          <>
            <ProductGrid products={list.slice(0, shown)} />
            <LoadMore shown={shown} total={list.length} href={href({ pagina: String(page + 1) })} />
          </>
        ) : (
          <EmptyState title="Nenhuma oferta com esses filtros">Tente tirar um filtro ou escolher outra faixa de preço.</EmptyState>
        )}
      </ListingLayout>
    </Container>
  );
}
