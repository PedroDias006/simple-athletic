import type { CategorySlug } from "../../../src/types/product";
import { termosDaRodada, termosDe } from "../categorias";
import { aviso, buscarJson, type AdaptadorLoja, type Oferta, type Verificacao } from "../tipos";

/**
 * Amazon Brasil — Creators API (substituta da PA-API 5.0 no Programa de Associados).
 * Docs: associados.amazon.com.br/creatorsapi/docs/en-us/introduction
 *
 * Liga sozinho quando AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET e AMAZON_PARTNER_TAG existem.
 * A Amazon só cria essas credenciais para conta de associado aprovada e com 10 vendas qualificadas
 * nos últimos 30 dias. Ainda não testado com credenciais reais.
 *
 * Preços da Amazon só podem aparecer no site se vierem desta API (contrato de associados).
 */
const API = "https://creatorsapi.amazon/catalog/v1";
/** Brasil usa o endpoint de login da região NA (credenciais versão 3.1). */
const TOKEN_URL = "https://api.amazon.com/auth/o2/token";
const MARKETPLACE = "www.amazon.com.br";
const PREFIXO = "amazon-";

const RECURSOS = [
  "itemInfo.title",
  "itemInfo.byLineInfo",
  "images.primary.large",
  "offersV2.listings.price",
  "offersV2.listings.availability",
  "offersV2.listings.condition",
  "offersV2.listings.dealDetails",
  "offersV2.listings.isBuyBoxWinner",
  "offersV2.listings.merchantInfo",
];

interface Dinheiro {
  amount: number;
  currency: string;
}

interface Listagem {
  isBuyBoxWinner?: boolean;
  availability?: { type?: string };
  condition?: { value?: string };
  dealDetails?: { endTime?: string };
  price?: { money?: Dinheiro; savingBasis?: { money?: Dinheiro }; savings?: { percentage?: number } };
}

interface ItemAmazon {
  asin: string;
  detailPageURL: string;
  itemInfo?: { title?: { displayValue: string }; byLineInfo?: { brand?: { displayValue: string } } };
  images?: { primary?: { large?: { url: string } } };
  offersV2?: { listings?: Listagem[] };
}

let token: { valor: string; expiraEm: number } | null = null;

/** Token OAuth (Login with Amazon, client credentials). Vale 1 hora; renovamos 5 min antes. */
async function obterToken(): Promise<string> {
  if (token && Date.now() < token.expiraEm) return token.valor;
  const r = await buscarJson<{ access_token: string; expires_in: number }>(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.AMAZON_CLIENT_ID,
      client_secret: process.env.AMAZON_CLIENT_SECRET,
      scope: "creatorsapi::default",
    }),
  });
  token = { valor: r.access_token, expiraEm: Date.now() + (r.expires_in - 300) * 1000 };
  return token.valor;
}

async function chamar<T>(operacao: "searchItems" | "getItems", corpo: Record<string, unknown>): Promise<T> {
  return buscarJson<T>(`${API}/${operacao}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await obterToken()}`,
      "Content-Type": "application/json",
      "x-marketplace": MARKETPLACE,
    },
    body: JSON.stringify({
      ...corpo,
      marketplace: MARKETPLACE,
      partnerTag: process.env.AMAZON_PARTNER_TAG,
      resources: RECURSOS,
    }),
  });
}

/** A oferta que aparece no botão "Comprar" da Amazon; se não vier marcada, a primeira nova. */
function melhorListagem(item: ItemAmazon): Listagem | undefined {
  const l = item.offersV2?.listings ?? [];
  return l.find((x) => x.isBuyBoxWinner) ?? l.find((x) => x.condition?.value === "New") ?? l[0];
}

function itemParaOferta(item: ItemAmazon, categoria: CategorySlug): Oferta | null {
  const oferta = melhorListagem(item);
  const preco = oferta?.price?.money?.amount;
  const precoDe = oferta?.price?.savingBasis?.money?.amount;
  const imageUrl = item.images?.primary?.large?.url;
  const title = item.itemInfo?.title?.displayValue;
  if (!preco || !imageUrl || !title) return null;
  if (oferta?.availability?.type && oferta.availability.type !== "IN_STOCK") return null;
  return {
    id: PREFIXO + item.asin,
    title,
    brand: item.itemInfo?.byLineInfo?.brand?.displayValue,
    category: categoria,
    store: "amazon",
    price: preco,
    oldPrice: precoDe && precoDe > preco ? precoDe : undefined,
    imageUrl,
    // detailPageURL já vem com a sua partnerTag.
    affiliateUrl: item.detailPageURL,
    // Ofertas relâmpago têm hora para acabar.
    expiresAt: oferta?.dealDetails?.endTime,
  };
}

export const amazon: AdaptadorLoja = {
  prefixo: PREFIXO,
  nome: "Amazon",

  motivoDesligado() {
    const faltando = ["AMAZON_CLIENT_ID", "AMAZON_CLIENT_SECRET", "AMAZON_PARTNER_TAG"].filter((k) => !process.env[k]);
    return faltando.length ? `defina ${faltando.join(", ")} (Creators API, liberada após 10 vendas em 30 dias)` : null;
  },

  async buscarOfertas(categoria) {
    const ofertas: Oferta[] = [];
    for (const termo of termosDaRodada(termosDe(categoria))) {
      try {
        const r = await chamar<{ searchResult?: { items?: ItemAmazon[] } }>("searchItems", {
          keywords: termo,
          searchIndex: "All",
          condition: "New",
          availability: "Available",
          itemCount: 10,
        });
        for (const item of r.searchResult?.items ?? []) {
          const o = itemParaOferta(item, categoria);
          if (o) ofertas.push(o);
        }
        await new Promise((r) => setTimeout(r, 1100)); // limite de 1 chamada por segundo
      } catch (e) {
        aviso(`Amazon, busca "${termo}": ${(e as Error).message}`);
      }
    }
    return ofertas;
  },

  async verificarOferta(id): Promise<Verificacao> {
    try {
      const asin = id.slice(PREFIXO.length);
      const r = await chamar<{ itemsResult?: { items?: ItemAmazon[] } }>("getItems", { itemIds: [asin], itemIdType: "ASIN" });
      const item = r.itemsResult?.items?.[0];
      const oferta = item && melhorListagem(item);
      const preco = oferta?.price?.money?.amount;
      if (!item || !preco) return { status: "indisponivel", motivo: "sem oferta" };
      if (oferta?.availability?.type && oferta.availability.type !== "IN_STOCK") return { status: "indisponivel", motivo: "sem estoque" };
      return { status: "ok", price: preco, oldPrice: oferta?.price?.savingBasis?.money?.amount, affiliateUrl: item.detailPageURL };
    } catch (e) {
      return { status: "erro", motivo: (e as Error).message };
    }
  },
};
