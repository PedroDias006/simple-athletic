import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import { Stripes } from "@/components/ui/Brand";
import { ArrowRight, StarIcon } from "@/components/ui/Icons";
import ProductCard, { DiscountTag } from "@/components/ui/ProductCard";
import ProductGallery from "@/components/ui/ProductGallery";
import Rail from "@/components/ui/Rail";
import { departmentBySlug, stores } from "@/data/catalog";
import { classify } from "@/lib/classify";
import { getDetails } from "@/lib/details";
import { departmentOf, discountOf, formatPrice, getActiveProducts, getProductById, savingsOf, sortByDiscount } from "@/lib/products";

type Props = { params: Promise<{ id: string }> };

/** "dd/mm às hh:mm" no horário de Brasília. */
function quando(iso: string) {
  const f = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  const p = (t: string) => f.formatToParts(new Date(iso)).find((x) => x.type === t)?.value;
  return `${p("day")}/${p("month")} às ${p("hour")}:${p("minute")}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProductById((await params).id);
  if (!p) return { title: "Produto não encontrado" };
  const d = discountOf(p);
  return {
    title: p.title,
    description: `${d > 0 ? `-${d}% · ` : ""}${formatPrice(p.price)} na ${stores[p.store].name}. Fotos, tamanhos e preço conferidos pelo robô da Simple Athletic.`,
    openGraph: { images: [p.imageUrl] },
  };
}

/**
 * Página do produto: fotos, tamanhos com oferta e o preço antes de ir para a loja.
 * O botão deixa claro para onde a pessoa vai ("Comprar no Mercado Livre").
 */
export default async function ProductPage({ params }: Props) {
  const raw = getProductById((await params).id);
  if (!raw) notFound();
  const product = classify(raw);
  const details = getDetails(product.id);
  const store = stores[product.store];
  const discount = discountOf(product);
  const savings = savingsOf(product);
  const images = details?.images?.length ? [product.imageUrl, ...details.images.filter((i) => i !== product.imageUrl)].slice(0, 7) : [product.imageUrl];
  const sizes = details?.sizes ?? [];
  const algumComOferta = sizes.some((s) => s.available);
  const precosVariam = new Set(sizes.filter((s) => s.price).map((s) => s.price)).size > 1;

  const parecidos = sortByDiscount(getActiveProducts("todos").filter((p) => p.id !== product.id && p.kind === product.kind && discountOf(p) > 0)).slice(0, 12);
  const dept = departmentOf(product);

  return (
    <>
      <Container className="pt-4 sm:pt-6">
        <p className="mb-4 text-sm">
          <Link href="/" className="hover:text-muted">Início</Link>
          <span className="text-muted"> / </span>
          <Link href={`/${dept}`} className="hover:text-muted">{departmentBySlug[dept]?.label ?? dept}</Link>
        </p>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          <ProductGallery images={images} alt={product.title} />

          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="flex items-center gap-2 text-sm font-medium text-muted">
              <Stripes className="h-[1em]" />
              {product.brand ? `${product.brand} · ` : ""}{store.name}
            </p>
            <h1 className="mt-2 text-2xl font-medium leading-tight sm:text-3xl">{product.title}</h1>

            {product.rating && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <span className="flex text-ink" aria-label={`Nota ${product.rating.toFixed(1)} de 5`}>
                  {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} width={14} height={14} className={n <= Math.round(product.rating!) ? "" : "text-line"} />)}
                </span>
                {product.rating.toFixed(1)}{product.reviews ? ` (${product.reviews.toLocaleString("pt-BR")} avaliações)` : ""}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-semibold">{formatPrice(product.price)}</span>
              {product.oldPrice && discount > 0 && <span className="text-lg text-muted line-through">{formatPrice(product.oldPrice)}</span>}
              {discount > 0 && <DiscountTag value={discount} />}
            </div>
            {savings > 0 && <p className="mt-1 font-medium text-deal">Você economiza {formatPrice(savings)}</p>}
            <p className="mt-1 text-sm text-muted">Preço conferido em {quando(product.updatedAt)}. Pode mudar na loja.</p>

            {(product.freeShipping || product.coupon) && (
              <ul className="mt-4 flex flex-wrap gap-2 text-sm">
                {product.freeShipping && <li className="rounded-full bg-snow px-3 py-1 font-medium text-deal">Frete grátis</li>}
                {product.coupon && <li className="rounded-full border border-dashed border-ink px-3 py-1">Cupom <b>{product.coupon}</b></li>}
              </ul>
            )}

            {/* Tamanhos: só o que o robô viu à venda na loja; esgotados aparecem riscados. */}
            {sizes.length > 0 && (
              <section className="mt-7">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-medium">{details?.sizeLabel ?? "Tamanho"}</h2>
                  {details?.checkedAt && <span className="text-xs text-muted">conferido em {quando(details.checkedAt)}</span>}
                </div>
                <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {sizes.map((s) =>
                    s.available && s.url && product.active ? (
                      // Tamanho com oferta: abre a loja já neste tamanho, na mesma oferta do preço mostrado.
                      <li key={s.label}>
                        <a
                          href={`/vai/${product.id}?tam=${encodeURIComponent(s.label)}`}
                          target="_blank"
                          rel="sponsored noopener"
                          title={s.note ? `${s.note} · abrir no ${store.name}` : `Abrir no ${store.name} no tamanho ${s.label}`}
                          className="flex h-full flex-col items-center justify-center rounded-lg border border-line px-1 py-2.5 text-center transition hover:border-ink hover:bg-ink hover:text-white"
                        >
                          <span className="font-medium">{s.label}</span>
                          {s.price && <span className="mt-0.5 text-[11px] opacity-70">{formatPrice(s.price)}</span>}
                        </a>
                      </li>
                    ) : (
                      <li
                        key={s.label}
                        title={s.note}
                        className={`flex flex-col items-center justify-center rounded-lg border px-1 py-2.5 text-center ${s.available ? "border-line" : "border-line bg-snow text-muted line-through"}`}
                      >
                        <span className="font-medium">{s.label}</span>
                        {s.available && s.price && <span className="mt-0.5 text-[11px] text-muted">{formatPrice(s.price)}</span>}
                      </li>
                    ),
                  )}
                </ul>
                <p className="mt-2 text-xs text-muted">
                  {algumComOferta
                    ? `Toque no tamanho para abrir o ${store.name} já nele, na oferta do preço mostrado.${precosVariam ? " O preço muda de um tamanho para outro." : ""} Riscados: sem oferta quando conferimos.`
                    : `Nenhum tamanho com oferta quando conferimos. Veja na loja se voltou.`}
                </p>
                {sizes.some((s) => s.note) && (
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer font-medium underline underline-offset-4">Guia de medidas</summary>
                    <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-muted">
                      {sizes.filter((s) => s.note).map((s) => <li key={s.label}><b className="text-ink">{s.label}</b> · {s.note}</li>)}
                    </ul>
                  </details>
                )}
              </section>
            )}

            {product.active ? (
              <>
                <a
                  href={`/vai/${product.id}`}
                  target="_blank"
                  rel="sponsored noopener"
                  className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-ink py-3 pl-3 pr-6 text-base font-semibold text-white transition hover:bg-hot"
                >
                  {/* Logo da loja num selo branco, para ficar legível em cima do botão escuro. */}
                  {store.logo && (
                    <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-full bg-white px-2.5">
                      <img src={store.logo} alt="" className="max-h-6 max-w-full object-contain" />
                    </span>
                  )}
                  <span className="text-left leading-tight">{sizes.length ? `Escolher tamanho e comprar no ${store.name}` : `Comprar no ${store.name}`}</span>
                  <ArrowRight width={18} height={18} className="shrink-0" />
                </a>
                <p className="mt-3 text-center text-xs text-muted">
                  Você vai para o site oficial do {store.name}. A compra, o pagamento e a entrega são feitos lá, com a garantia da loja.
                </p>
              </>
            ) : (
              <div className="mt-8 rounded-2xl bg-snow p-5">
                <p className="font-medium">Essa oferta acabou.</p>
                <p className="mt-1 text-sm text-muted">O preço subiu ou o produto esgotou na loja. Veja os parecidos em promoção logo abaixo.</p>
              </div>
            )}
          </div>
        </div>
      </Container>

      {parecidos.length > 0 && (
        <Container className="mt-20 sm:mt-24">
          <Rail title="Parecidos em promoção">
            {parecidos.map((p) => <ProductCard key={p.id} product={p} />)}
          </Rail>
        </Container>
      )}
    </>
  );
}
