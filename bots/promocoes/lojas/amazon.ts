import { createHash, createHmac } from "node:crypto";
import type { CategorySlug } from "../../../src/types/product";
import { termosDe } from "../categorias";
import { aviso, buscarJson, DESCONTO_MINIMO, type AdaptadorLoja, type Oferta, type Verificacao } from "../tipos";

/**
 * Amazon Brasil — Product Advertising API 5.0 (oficial do Programa de Associados).
 * Liga sozinho quando AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY e AMAZON_PARTNER_TAG existem.
 * Ainda não testado com chaves reais: a Amazon só libera a API depois das primeiras vendas.
 */
const HOST = "webservices.amazon.com.br";
const REGIAO = "us-east-1";
const SERVICO = "ProductAdvertisingAPI";
const PREFIXO = "amazon-";

const RECURSOS = [
  "ItemInfo.Title",
  "ItemInfo.ByLineInfo",
  "Images.Primary.Large",
  "Offers.Listings.Price",
  "Offers.Listings.SavingBasis",
  "Offers.Listings.DeliveryInfo.IsFreeShippingEligible",
];

interface ItemAmazon {
  ASIN: string;
  DetailPageURL: string;
  ItemInfo?: { Title?: { DisplayValue: string }; ByLineInfo?: { Brand?: { DisplayValue: string } } };
  Images?: { Primary?: { Large?: { URL: string } } };
  Offers?: {
    Listings?: {
      Price?: { Amount: number };
      SavingBasis?: { Amount: number };
      DeliveryInfo?: { IsFreeShippingEligible?: boolean };
    }[];
  };
}

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
const hmac = (k: Buffer | string, s: string) => createHmac("sha256", k).update(s, "utf8").digest();

/** Chamada assinada (AWS Signature V4), como pede a PA-API. */
async function paapi<T>(operacao: "SearchItems" | "GetItems", corpo: Record<string, unknown>): Promise<T> {
  const payload = JSON.stringify({
    ...corpo,
    PartnerTag: process.env.AMAZON_PARTNER_TAG,
    PartnerType: "Associates",
    Marketplace: "www.amazon.com.br",
    Resources: RECURSOS,
  });
  const caminho = `/paapi5/${operacao.toLowerCase()}`;
  const alvo = `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operacao}`;
  const amzDate = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dia = amzDate.slice(0, 8);

  const cabecalhos: Record<string, string> = {
    "content-encoding": "amz-1.0",
    "content-type": "application/json; charset=utf-8",
    host: HOST,
    "x-amz-date": amzDate,
    "x-amz-target": alvo,
  };
  const assinados = Object.keys(cabecalhos).join(";");
  const canonico = ["POST", caminho, "", ...Object.entries(cabecalhos).map(([k, v]) => `${k}:${v}`), "", assinados, sha256(payload)].join("\n");
  const escopo = `${dia}/${REGIAO}/${SERVICO}/aws4_request`;
  const paraAssinar = ["AWS4-HMAC-SHA256", amzDate, escopo, sha256(canonico)].join("\n");
  const chave = hmac(hmac(hmac(hmac(`AWS4${process.env.AMAZON_SECRET_KEY}`, dia), REGIAO), SERVICO), "aws4_request");
  const assinatura = createHmac("sha256", chave).update(paraAssinar).digest("hex");

  return buscarJson<T>(`https://${HOST}${caminho}`, {
    method: "POST",
    headers: {
      ...cabecalhos,
      authorization: `AWS4-HMAC-SHA256 Credential=${process.env.AMAZON_ACCESS_KEY}/${escopo}, SignedHeaders=${assinados}, Signature=${assinatura}`,
    },
    body: payload,
  });
}

function itemParaOferta(item: ItemAmazon, categoria: CategorySlug): Oferta | null {
  const oferta = item.Offers?.Listings?.[0];
  const imageUrl = item.Images?.Primary?.Large?.URL;
  const title = item.ItemInfo?.Title?.DisplayValue;
  if (!oferta?.Price || !oferta.SavingBasis || !imageUrl || !title) return null;
  return {
    id: PREFIXO + item.ASIN,
    title,
    brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
    category: categoria,
    store: "amazon",
    price: oferta.Price.Amount,
    oldPrice: oferta.SavingBasis.Amount,
    imageUrl,
    // DetailPageURL já vem com a sua PartnerTag.
    affiliateUrl: item.DetailPageURL,
    freeShipping: oferta.DeliveryInfo?.IsFreeShippingEligible || undefined,
  };
}

export const amazon: AdaptadorLoja = {
  prefixo: PREFIXO,
  nome: "Amazon",

  motivoDesligado() {
    const faltando = ["AMAZON_ACCESS_KEY", "AMAZON_SECRET_KEY", "AMAZON_PARTNER_TAG"].filter((k) => !process.env[k]);
    return faltando.length ? `defina ${faltando.join(", ")}` : null;
  },

  async buscarOfertas(categoria) {
    const ofertas: Oferta[] = [];
    for (const termo of termosDe(categoria)) {
      try {
        const r = await paapi<{ SearchResult?: { Items?: ItemAmazon[] } }>("SearchItems", {
          Keywords: termo,
          SearchIndex: "All",
          MinSavingPercent: DESCONTO_MINIMO,
          ItemCount: 10,
        });
        for (const item of r.SearchResult?.Items ?? []) {
          const o = itemParaOferta(item, categoria);
          if (o) ofertas.push(o);
        }
        await new Promise((r) => setTimeout(r, 1100)); // limite: 1 chamada por segundo
      } catch (e) {
        aviso(`Amazon, busca "${termo}": ${(e as Error).message}`);
      }
    }
    return ofertas;
  },

  async verificarOferta(id): Promise<Verificacao> {
    try {
      const asin = id.slice(PREFIXO.length);
      const r = await paapi<{ ItemsResult?: { Items?: ItemAmazon[] } }>("GetItems", { ItemIds: [asin] });
      const item = r.ItemsResult?.Items?.[0];
      const oferta = item?.Offers?.Listings?.[0];
      if (!item || !oferta?.Price) return { status: "indisponivel", motivo: "sem oferta" };
      return {
        status: "ok",
        price: oferta.Price.Amount,
        oldPrice: oferta.SavingBasis?.Amount,
        freeShipping: oferta.DeliveryInfo?.IsFreeShippingEligible,
        affiliateUrl: item.DetailPageURL,
      };
    } catch (e) {
      return { status: "erro", motivo: (e as Error).message };
    }
  },
};
