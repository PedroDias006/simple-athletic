import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import { SectionTitle, Stripes } from "@/components/ui/Brand";
import HeroCarousel, { type HeroDeal } from "@/components/ui/HeroCarousel";
import { BrandStrip, DealOfTheDay, PopularSearches, PriceRangeGrid, PriceTicker } from "@/components/ui/HomeBlocks";
import ProductCard from "@/components/ui/ProductCard";
import Rail from "@/components/ui/Rail";
import { CategoryTile, DepartmentTile, EmptyState, TopicCard } from "@/components/ui/Sections";
import { campaign, campaignFem, campaignMasc, categories, departments, heroSlides, slideOfertas, stores, TELEGRAM_URL, topics, topicsFem, topicsMasc } from "@/data/catalog";
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
  const deptCounts = countBy(active, departmentOf);
  const topicCount = (t: (typeof topics)[number]) =>
    t.kinds ? t.kinds.reduce((n, k) => n + filterProducts(active, { kind: k }).length, 0) : filterProducts(active, { department: t.department, group: t.group }).length;
  const maxDiscount = byDiscount[0] ? discountOf(byDiscount[0]) : 0;
  // Slide "Achados do dia": os maiores descontos reais, no máximo um por tipo de produto.
  const kindsSeen = new Set<string>();
  const deals: HeroDeal[] = byDiscount
    .filter((p) => discountOf(p) > 0 && p.price > 0 && p.imageUrl && !kindsSeen.has(p.kind) && kindsSeen.add(p.kind))
    .slice(0, 4)
    .map((p) => ({ id: p.id, title: p.title, store: stores[p.store].name, price: p.price, oldPrice: p.oldPrice!, imageUrl: p.imageUrl, updatedAt: p.updatedAt }));
  const endingSoon = active
    .filter((p) => p.expiresAt)
    .sort((a, b) => Date.parse(a.expiresAt!) - Date.parse(b.expiresAt!))
    .slice(0, 9);

  return (
    <>
      {/* Carrossel principal */}
      <div className="mx-auto w-full max-w-[1800px] pt-2 sm:px-4 sm:pt-4 lg:px-6">
        <HeroCarousel
          slides={deals.length >= 2 ? [heroSlides[mode][0], slideOfertas, ...heroSlides[mode].slice(1)] : heroSlides[mode]}
          deals={deals}
          maxDiscount={maxDiscount}
        />
      </div>

      {/* Manifesto: o que a marca faz e o que as duas listras querem dizer */}
      <section id="manifesto" className="mt-16 scroll-mt-24 sm:mt-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16">
            <div className="relative flex aspect-[5/4] items-center justify-center overflow-hidden bg-snow">
              <div aria-hidden className="flex h-[78%] w-[46%] gap-[9%]">
                <span className="flex-1 -skew-x-[18deg] bg-ink" />
                <span className="flex-1 -skew-x-[18deg] bg-hot" />
              </div>
              <span className="absolute left-5 top-5 rounded-full bg-white px-4 py-1.5 text-sm font-medium sm:left-8 sm:top-8">pra ela</span>
              <span className="absolute bottom-5 right-5 rounded-full bg-white px-4 py-1.5 text-sm font-medium sm:bottom-8 sm:right-8">pra ele</span>
              <span className="absolute bottom-5 left-5 rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-white sm:bottom-8 sm:left-8">pra todo mundo</span>
            </div>
            <div>
              <p className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-hot">
                <Stripes className="h-[1.1em]" /> Nossa ideia
              </p>
              <h2 className="mt-3 font-display text-5xl uppercase leading-[0.92] sm:text-6xl xl:text-7xl">Feito pra quem treina. Ou seja, todo mundo.</h2>
              <p className="mt-5 max-w-xl text-base sm:text-lg">
                A Simple Athletic nasceu de uma implicância: tênis bom, roupa boa e suplemento de qualidade parecem coisa de poucos. Não são.
                Um robô confere as maiores lojas de esporte do Brasil de hora em hora e só mostra desconto que é de verdade. Você compra direto
                na loja oficial, com a mesma garantia, pagando menos.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6">
                {[
                  { label: "Todo mundo", color: "#d43f21" },
                  { label: "Ela", color: "#e0457b" },
                  { label: "Ele", color: "#1d5fd1" },
                ].map((v) => (
                  <span key={v.label} className="flex items-center gap-2 text-sm font-medium">
                    <span aria-hidden className="flex h-5 gap-[3px]">
                      <span className="w-[5px] -skew-x-[18deg] bg-[#111]" />
                      <span className="w-[5px] -skew-x-[18deg]" style={{ background: v.color }} />
                    </span>
                    {v.label}
                  </span>
                ))}
                <p className="w-full text-sm text-muted">
                  A listra preta é a base que todo mundo divide. A colorida muda com você: laranja pra todo mundo, rosa no modo feminino, azul no masculino.
                </p>
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {[
                  { n: active.length.toLocaleString("pt-BR"), t: "ofertas no ar agora" },
                  { n: String(Object.keys(stores).length), t: "lojas oficiais" },
                  { n: "1h", t: "entre cada conferida" },
                  { n: maxDiscount > 0 ? `-${maxDiscount}%` : "0", t: "maior desconto hoje" },
                ].map((s) => (
                  <div key={s.t}>
                    <dt className="sr-only">{s.t}</dt>
                    <dd className="font-display text-4xl text-hot sm:text-5xl">{s.n}</dd>
                    <dd className="mt-1 text-sm text-muted">{s.t}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
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
          <SectionTitle>Como funciona</SectionTitle>
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
          <SectionTitle>Lojas parceiras</SectionTitle>
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
