import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Stripes } from "@/components/ui/Brand";
import { ArrowRight } from "@/components/ui/Icons";
import Passagem from "@/components/ui/Passagem";
import { stores } from "@/data/catalog";
import { getDetails } from "@/lib/details";
import { discountOf, formatPrice, getProductById, savingsOf } from "@/lib/products";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tam?: string }> };

export const metadata: Metadata = { title: "Abrindo a loja", robots: { index: false, follow: false } };

/**
 * Telinha de passagem antes da loja: deixa claro que o site achou a oferta e agora leva a pessoa
 * até ela, no tamanho e no preço escolhidos. Quem leva de fato é /ir/[id] (o link de afiliado).
 */
export default async function VaiPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tam } = await searchParams;
  const product = getProductById(id);
  if (!product) redirect("/");
  if (!product.active) redirect(`/produto/${id}`);

  const store = stores[product.store];
  const tamanho = tam ? getDetails(id)?.sizes?.find((s) => s.label === tam && s.available && s.url) : undefined;
  const preco = tamanho?.price ?? product.price;
  const discount = discountOf(product);
  const savings = tamanho?.price ? 0 : savingsOf(product);
  const destino = `/ir/${id}${tamanho ? `?tam=${encodeURIComponent(tamanho.label)}` : ""}`;

  return (
    // Cobre o menu e o rodapé: aqui só importa a passagem para a loja.
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-white px-4 py-10">
      <div className="w-full max-w-md text-center">
        <p className="flex items-center justify-center gap-2 font-display text-lg uppercase tracking-wide">
          <Stripes className="h-[1em]" />
          Simple Athletic
        </p>

        <h1 className="mt-8 text-2xl font-semibold leading-tight sm:text-3xl">Achamos o menor preço pra você.</h1>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-line p-3 text-left">
          <img src={product.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl bg-snow object-contain" />
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm">{product.title}</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="text-lg font-semibold">{formatPrice(preco)}</span>
              {!tamanho?.price && product.oldPrice && discount > 0 && <span className="text-sm text-muted line-through">{formatPrice(product.oldPrice)}</span>}
              {tamanho && <span className="text-sm text-muted">· tamanho {tamanho.label}</span>}
            </p>
            {savings > 0 && <p className="text-sm font-medium text-deal">Você economiza {formatPrice(savings)}</p>}
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-3 text-base">
          {store.logo && <img src={store.logo} alt="" className="h-6 max-w-16 object-contain" />}
          <span>
            Abrindo o <b>{store.name}</b>{tamanho ? <> já no tamanho <b>{tamanho.label}</b></> : ""}...
          </span>
        </p>
        <p className="mt-2 text-sm text-muted">
          Lá é só {tamanho ? "tocar em" : "escolher o tamanho e tocar em"} <b className="text-ink">&quot;Comprar&quot;</b>. Compra, pagamento e entrega são com o {store.name}, com a garantia da loja.
        </p>

        <Passagem destino={destino} />

        <a
          href={destino}
          rel="sponsored noopener"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-white transition hover:bg-hot"
        >
          Abrir agora <ArrowRight width={18} height={18} />
        </a>
        <p className="mt-4 text-sm">
          <Link href={`/produto/${id}`} className="text-muted underline underline-offset-4 hover:text-ink">Voltar para o produto</Link>
        </p>
      </div>
    </div>
  );
}
