import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Container from "@/components/layout/Container";
import { AmazonSearch, DepartmentTile, EmptyState, PageHeader, ProductGrid } from "@/components/ui/Sections";
import { SearchIcon } from "@/components/ui/Icons";
import { departments } from "@/data/catalog";
import { getMode, modeLabel, type Mode } from "@/lib/mode";
import { searchProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Buscar ofertas", robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string; tipo?: string }> };

const popular: Record<Mode, string[]> = {
  todos: ["chuteira", "tênis de corrida", "legging", "camiseta dry fit", "whey", "raquete", "joelheira"],
  feminino: ["legging", "top", "cropped", "short saia", "conjunto", "tênis feminino", "garrafa"],
  masculino: ["camiseta dry fit", "regata", "bermuda", "compressão", "jogger", "tênis masculino", "chuteira"],
};

/** Links antigos /busca?tipo=... agora vivem nas páginas de departamento. */
const legacyTopics: Record<string, string> = {
  camisetas: "/roupas?tipo=camiseta",
  shorts: "/roupas?tipo=shorts",
  tenis: "/calcados?grupo=tenis",
  chuteiras: "/calcados?grupo=chuteiras",
  moletons: "/roupas?tipo=moletom",
  calcas: "/roupas?tipo=calca",
  acessorios: "/acessorios",
};

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  if (!q && sp.tipo && legacyTopics[sp.tipo]) redirect(legacyTopics[sp.tipo]);

  const mode = await getMode();
  const results = searchProducts(q, mode);

  return (
    <Container>
      <form action="/busca" role="search" className="relative mx-auto mt-6 max-w-2xl sm:mt-10">
        <SearchIcon width={24} height={24} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
        <input name="q" type="search" defaultValue={q} autoFocus={!q} placeholder={mode === "todos" ? "Buscar" : `Buscar no ${modeLabel[mode].toLowerCase()}`} aria-label="Buscar ofertas"
          className="h-14 w-full rounded-full bg-snow pl-14 pr-6 text-lg outline-none transition placeholder:text-muted focus:bg-line" />
      </form>

      {!q && (
        <div className="mx-auto mt-6 max-w-2xl">
          <p className="text-muted">Termos populares</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {popular[mode].map((t) => (
              <li key={t}>
                <Link href={`/busca?q=${encodeURIComponent(t)}`} className="block rounded-full bg-snow px-4 py-2 font-medium transition hover:bg-line">{t}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {q && (
        <>
          <PageHeader title={`Resultados para "${q}"`} count={results.length} />
          {results.length ? <ProductGrid products={results} wide /> : (
            <EmptyState title="Nada encontrado">
              {mode === "todos" ? "" : `No modo ${modeLabel[mode].toLowerCase()} só aparecem produtos ${mode === "feminino" ? "para ela" : "para ele"}. `}Tente outro termo ou navegue pelos departamentos abaixo.
            </EmptyState>
          )}
          <AmazonSearch term={q} label={`"${q}"`} />
        </>
      )}

      {(!q || !results.length) && (
        <div className="mt-16">
          <h2 className="mb-4 text-xl font-medium sm:text-2xl">Compre por departamento</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
            {departments.map((d) => <DepartmentTile key={d.slug} department={d} mode={mode} className="aspect-square" />)}
          </div>
        </div>
      )}
    </Container>
  );
}
