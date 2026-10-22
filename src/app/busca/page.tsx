import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { CategoryTile, EmptyState, PageHeader, ProductGrid } from "@/components/ui/Sections";
import { SearchIcon } from "@/components/ui/Icons";
import { categories, topicBySlug, topics } from "@/data/catalog";
import { searchAny, searchProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Buscar ofertas", robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string; tipo?: string }> };

const popular = ["chuteira", "tênis de corrida", "whey", "creatina", "raquete", "halter"];

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const topic = !q && sp.tipo ? topicBySlug[sp.tipo] : undefined;
  const results = topic ? searchAny(topic.terms, topic.excludeCategories) : searchProducts(q);
  const searched = Boolean(q || topic);

  return (
    <Container>
      <form action="/busca" role="search" className="relative mx-auto mt-6 max-w-2xl sm:mt-10">
        <SearchIcon width={24} height={24} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
        <input name="q" type="search" defaultValue={q} autoFocus={!searched} placeholder="Buscar" aria-label="Buscar ofertas"
          className="h-14 w-full rounded-full bg-snow pl-14 pr-6 text-lg outline-none transition placeholder:text-muted focus:bg-line" />
      </form>

      {!searched && (
        <div className="mx-auto mt-6 max-w-2xl">
          <p className="text-muted">Termos populares</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {popular.map((t) => (
              <li key={t}>
                <Link href={`/busca?q=${encodeURIComponent(t)}`} className="block rounded-full bg-snow px-4 py-2 font-medium transition hover:bg-line">{t}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {searched && (
        <>
          {topic ? (
            <PageHeader crumb={topic.label} title={topic.label} count={results.length} description={topic.description} />
          ) : (
            <PageHeader title={`Resultados para "${q}"`} count={results.length} />
          )}
          {topic && (
            <ul className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
              {topics.map((t) => (
                <li key={t.slug} className="shrink-0">
                  <Link
                    href={`/busca?tipo=${t.slug}`}
                    aria-current={t.slug === topic.slug ? "page" : undefined}
                    className={`block rounded-full border px-4 py-2 text-sm transition ${t.slug === topic.slug ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {results.length ? <ProductGrid products={results} wide /> : (
            <EmptyState title={topic ? "Nenhuma oferta deste tipo agora" : "Nada encontrado"}>
              {topic ? "O robô confere as lojas de hora em hora. Enquanto isso, veja os esportes abaixo." : "Tente outro termo ou navegue pelos esportes abaixo."}
            </EmptyState>
          )}
        </>
      )}

      {(!searched || !results.length) && (
        <div className="mt-16">
          <h2 className="mb-4 text-xl font-medium sm:text-2xl">Compre por esporte</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {categories.map((c) => <CategoryTile key={c.slug} category={c} className="aspect-square" sizes="(max-width: 1024px) 50vw, 25vw" />)}
          </div>
        </div>
      )}
    </Container>
  );
}
