import { createHash } from "node:crypto";
import type { CategorySlug } from "../../../src/types/product";
import { termosDaRodada, termosDe } from "../categorias";
import { aviso, buscarJson, DESCONTO_MINIMO, type AdaptadorLoja, type Oferta, type Verificacao } from "../tipos";

/**
 * Shopee — API oficial do Programa de Afiliados (GraphQL).
 * Liga sozinho quando SHOPEE_APP_ID e SHOPEE_APP_SECRET existem (painel affiliate.shopee.com.br > Open API).
 * Ainda não testado com chaves reais.
 */
const API = "https://open-api.affiliate.shopee.com.br/graphql";
const PREFIXO = "shopee-";

interface NoShopee {
  itemId: number | string;
  productName: string;
  priceMin: string;
  priceDiscountRate?: number;
  imageUrl: string;
  offerLink: string;
  ratingStar?: string;
  sales?: number;
}

const CAMPOS = "itemId productName priceMin priceDiscountRate imageUrl offerLink ratingStar sales";

async function graphql<T>(query: string): Promise<T> {
  const payload = JSON.stringify({ query });
  const appId = process.env.SHOPEE_APP_ID!;
  const ts = Math.floor(Date.now() / 1000);
  const assinatura = createHash("sha256").update(`${appId}${ts}${payload}${process.env.SHOPEE_APP_SECRET}`).digest("hex");
  const r = await buscarJson<{ data?: T; errors?: { message: string }[] }>(API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `SHA256 Credential=${appId}, Timestamp=${ts}, Signature=${assinatura}`,
    },
    body: payload,
  });
  if (r.errors?.length || !r.data) throw new Error(r.errors?.map((e) => e.message).join("; ") ?? "resposta vazia");
  return r.data;
}

/** A Shopee informa só o preço atual e o % de desconto; o preço "de" é calculado a partir deles. */
function precoDe(price: number, taxa?: number) {
  return taxa && taxa > 0 && taxa < 100 ? Math.round((price / (1 - taxa / 100)) * 100) / 100 : undefined;
}

function noParaOferta(n: NoShopee, categoria: CategorySlug): Oferta | null {
  const price = Number(n.priceMin);
  if (!price || (n.priceDiscountRate ?? 0) < DESCONTO_MINIMO) return null;
  return {
    id: PREFIXO + n.itemId,
    title: n.productName,
    category: categoria,
    store: "shopee",
    price,
    oldPrice: precoDe(price, n.priceDiscountRate),
    imageUrl: n.imageUrl,
    affiliateUrl: n.offerLink,
    rating: n.ratingStar ? Number(n.ratingStar) : undefined,
    reviews: n.sales,
  };
}

export const shopee: AdaptadorLoja = {
  prefixo: PREFIXO,
  nome: "Shopee",

  motivoDesligado() {
    return process.env.SHOPEE_APP_ID && process.env.SHOPEE_APP_SECRET ? null : "defina SHOPEE_APP_ID e SHOPEE_APP_SECRET";
  },

  async buscarOfertas(categoria) {
    const ofertas: Oferta[] = [];
    for (const termo of termosDaRodada(termosDe(categoria))) {
      try {
        // sortType 2 = mais vendidos
        const d = await graphql<{ productOfferV2: { nodes: NoShopee[] } }>(
          `{ productOfferV2(keyword: ${JSON.stringify(termo)}, sortType: 2, page: 1, limit: 30) { nodes { ${CAMPOS} } } }`,
        );
        for (const n of d.productOfferV2.nodes) {
          const o = noParaOferta(n, categoria);
          if (o) ofertas.push(o);
        }
      } catch (e) {
        aviso(`Shopee, busca "${termo}": ${(e as Error).message}`);
      }
    }
    return ofertas;
  },

  async verificarOferta(id): Promise<Verificacao> {
    try {
      const itemId = id.slice(PREFIXO.length);
      const d = await graphql<{ productOfferV2: { nodes: NoShopee[] } }>(`{ productOfferV2(itemId: ${Number(itemId)}, limit: 1) { nodes { ${CAMPOS} } } }`);
      const n = d.productOfferV2.nodes[0];
      if (!n) return { status: "indisponivel", motivo: "item não encontrado" };
      const price = Number(n.priceMin);
      return { status: "ok", price, oldPrice: precoDe(price, n.priceDiscountRate), affiliateUrl: n.offerLink };
    } catch (e) {
      return { status: "erro", motivo: (e as Error).message };
    }
  },
};
