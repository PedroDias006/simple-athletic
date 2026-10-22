import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { BrandStrip, DealOfTheDay, PopularSearches, PriceRangeGrid, PriceTicker } from "@/components/ui/HomeBlocks";
import ProductCard, { DiscountTag } from "@/components/ui/ProductCard";
import Rail from "@/components/ui/Rail";
import { CategoryTile, DepartmentTile, EmptyState, TopicCard } from "@/components/ui/Sections";
import { campaign, campaignFem, campaignMasc, categories, departments, homeCopy, stores, TELEGRAM_URL, topics, topicsFem, topicsMasc } from "@/data/catalog";
import { getMode } from "@/lib/mode";
import { countBy, departmentOf, discountOf, filterProducts, getActiveProducts, getBrands, sortByDiscount } from "@/lib/products";

const steps = [
  { n: "01", title: "A gente vigia os preços", text: "Um robô confere as maiores lojas de esporte do Brasil de hora em hora." },
  { n: "02", title: "Promoções em primeiro lugar", text: "O que está com desconto aparece no topo, com a etiqueta de quanto você economiza. Preço atualizado pelo robô." },
  { n: "03", title: "Você compra na loja", text: "O clique leva direto para a loja oficial. Mesmo preço, mesma garantia." },
];

export default async function Home() {
  const mode = await getMode();
  const fem = mode === "feminino";
  const masc = mode === "masculino";
  const active = getActiveProducts(mode);
  const byDiscount = sortByDiscount(active);
  const photos = fem ? campaignFem : masc ? campaignMasc : campaign;
  const copy = homeCopy[mode];
  const deptCounts = countBy(active, departmentOf);
  const topicCount = (t: (typeof topics)[number]) =>
    t.kinds ? t.kinds.reduce((n, k) => n + filterProducts(active, { kind: k }).length, 0) : filterProducts(active, { department: t.department, group: t.group }).length;
  const maxDiscount = byDiscount[0] ? discountOf(byDiscount[0]) : 0;
  const endingSoon = active
    .filter((p) => p.expiresAt)
    .sort((a, b) => Date.parse(a.expiresAt!) - Date.parse(b.expiresAt!))
    .slice(0, 9);

  return (
    <>
      {/* Campanha principal */}
      <section>
        <Container className="pt-2 sm:pt-4">
          <Link href="/ofertas" className="relative block aspect-[4/5] overflow-hidden bg-snow sm:aspect-[16/9] lg:aspect-[21/9]">
            <Image src={photos.hero} alt={copy.heroAlt} fill priority sizes="100vw" className="object-cover object-[50%_40%]" />
          </Link>
        </Container>
        <div className="mx-auto max-w-4xl px-4 pt-8 text-center sm:pt-12">
          {maxDiscount > 0 ? (
            <p className="flex items-center justify-center gap-3 font-medium">
              Até <DiscountTag value={maxDiscount} /> hoje
            </p>
          ) : (
            <p className="font-medium">Promoções de esporte, conferidas de hora em hora</p>
          )}
          <h1 className="mt-4 font-display text-[3.25rem] uppercase leading-[0.9] sm:text-7xl lg:text-[6.5rem]">
            {copy.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg">{copy.text}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/ofertas" className="rounded-full bg-ink px-6 py-2.5 font-medium text-white transition hover:bg-black/70">Ver ofertas</Link>
            <Link href="/ofertas?ordem=desconto" className="rounded-full border border-line px-6 py-2.5 font-medium transition hover:border-ink">Maiores descontos</Link>
          </div>
        </div>
      </section>

      <div className="mt-14 sm:mt-16">
        <PriceTicker products={byDiscount.slice(0, 10)} />
      </div>

      <Container className="mt-16 sm:mt-20">
        <Rail title={fem ? "Departamentos femininos" : masc ? "Departamentos masculinos" : "Compre por departamento"} itemClassName="w-[62%] sm:w-[36%] lg:w-[calc((100%-48px)/5)]">
          {departments.map((d) => <DepartmentTile key={d.slug} department={d} mode={mode} count={deptCounts.get(d.slug)} />)}
        </Rail>
      </Container>

      <Container className="mt-16 sm:mt-20">
        <Rail title={fem ? "Compre por tipo, pra ela" : masc ? "Compre por tipo, pra ele" : "Compre por tipo"} itemClassName="w-[62%] sm:w-[36%] lg:w-[calc((100%-36px)/4)]">
          {(fem ? topicsFem : masc ? topicsMasc : topics).map((t) => <TopicCard key={t.href + t.label} topic={t} count={topicCount(t)} />)}
        </Rail>
      </Container>

      <Container className="mt-16 sm:mt-20">
        {byDiscount.length ? (
          <Rail title="Maiores descontos agora" href="/ofertas">
            {byDiscount.slice(1, 13).map((p, i) => <ProductCard key={p.id} product={p} priority={i < 3} />)}
          </Rail>
        ) : (
          <EmptyState title="Nenhuma oferta no momento">O robô está procurando novas promoções. Volte daqui a pouco.</EmptyState>
        )}
      </Container>

      {byDiscount[0] && (
        <Container className="mt-20 sm:mt-24">
          <DealOfTheDay product={byDiscount[0]} />
        </Container>
      )}

      <Container className="mt-20 sm:mt-24">
        <Rail title="Compre por esporte" href="/categorias">
          {categories.map((c) => <CategoryTile key={c.slug} category={c} />)}
        </Rail>
      </Container>

      <Container className="mt-20 sm:mt-24">
        <PriceRangeGrid products={active} />
      </Container>

      {endingSoon.length > 0 && (
        <Container className="mt-20 sm:mt-24">
          <Rail title="Acabando logo" href="/ofertas?ordem=expira" itemClassName="w-[46%] sm:w-[31%] lg:w-[calc((100%-36px)/4)]">
            {endingSoon.map((p) => <ProductCard key={p.id} product={p} />)}
          </Rail>
        </Container>
      )}

      {/* Banner do canal */}
      <section className="mt-20 sm:mt-24">
        <Container>
          <div className="relative overflow-hidden bg-ink text-white">
            <Image src={photos.banner} alt="" fill sizes="100vw" className="object-cover opacity-75 grayscale" />
            <div className="relative flex min-h-[460px] flex-col justify-end p-6 sm:min-h-[520px] sm:p-12">
              <h2 className="max-w-3xl font-display text-5xl uppercase leading-[0.9] sm:text-7xl">Não perca a próxima queda</h2>
              <p className="mt-4 max-w-md text-base sm:text-lg">O canal avisa no instante em que um preço despenca. Grátis e sem spam.</p>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener" className="mt-6 w-fit rounded-full bg-white px-6 py-2.5 font-medium text-ink transition hover:bg-snow">
                Entrar no canal
              </a>
            </div>
          </div>
        </Container>
      </section>

      <Container className="mt-20 sm:mt-24">
        <BrandStrip brands={getBrands(active)} />
      </Container>

      {/* Como funciona */}
      <Container className="mt-20 sm:mt-24">
        <div id="como-funciona" className="scroll-mt-24">
          <h2 className="text-xl font-medium sm:text-2xl">Como funciona</h2>
          <ol className="mt-6 grid gap-8 border-t border-line pt-8 sm:grid-cols-3 sm:gap-12">
            {steps.map((s) => (
              <li key={s.n}>
                <p className="font-display text-4xl text-hot">{s.n}</p>
                <p className="mt-3 text-lg font-medium">{s.title}</p>
                <p className="mt-1 text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>

      {/* Lojas */}
      <Container className="mt-20 sm:mt-24">
        <div id="lojas" className="scroll-mt-24">
          <h2 className="text-xl font-medium sm:text-2xl">Lojas parceiras</h2>
          <ul className="mt-6 grid grid-cols-2 border-l border-t border-line sm:grid-cols-4 lg:grid-cols-7">
            {Object.entries(stores).map(([id, s]) => (
              <li key={id}>
                <Link href={`/ofertas?loja=${id}`} title={`Ofertas ${s.name}`} className="group flex h-24 items-center justify-center border-b border-r border-line px-6 text-center font-medium transition hover:bg-snow sm:h-28">
                  {s.logo ? (
                    <img src={s.logo} alt={s.name} loading="lazy" className="max-h-9 max-w-full object-contain transition group-hover:scale-105" />
                  ) : (
                    s.name
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <Container className="mt-20 sm:mt-24">
        <PopularSearches />
      </Container>
    </>
  );
}
