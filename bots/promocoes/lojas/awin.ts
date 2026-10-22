import { gunzipSync } from "node:zlib";
import { normalize } from "../../../src/lib/classify";
import type { CategorySlug, StoreId } from "../../../src/types/product";
import { termosDaRodada, termosDe } from "../categorias";
import { aviso, DESCONTO_MINIMO, descontoPercentual, type AdaptadorLoja, type Oferta, type Verificacao } from "../tipos";

/**
 * Awin — rede de afiliados onde estão Netshoes, Centauro, Decathlon e outras lojas de esporte.
 * Usa os feeds de produtos (CSV) que cada loja publica para os afiliados aprovados nela.
 *
 * Liga com AWIN_FEED_API_KEY: a chave de feeds (ui.awin.com > Toolbox > Create-a-Feed), que é
 * diferente do token da API do publisher. Só entram lojas em que você já foi aprovado na Awin.
 *
 * Fluxo: lista de feeds -> baixa o feed de cada loja de esporte aprovada (uma vez por execução) ->
 * filtra por termo de busca e desconto >= 15% (preço "de" vem de product_price_old ou rrp_price).
 * Link de afiliado: aw_deep_link, que já vem rastreado com o seu ID de publisher.
 */
const PREFIXO = "awin-";
const LISTA = (chave: string) => `https://productdata.awin.com/datafeed/list/apikey/${chave}`;

/** Nome do anunciante na Awin -> loja do site. Lojas fora desta lista são ignoradas. */
const LOJAS: [RegExp, StoreId][] = [
  [/netshoes/i, "netshoes"],
  [/centauro/i, "centauro"],
  [/decathlon/i, "decathlon"],
  [/magalu|magazine luiza/i, "magalu"],
];

/** Máximo de ofertas por termo de busca, para uma loja enorme não lotar o site sozinha. */
const POR_TERMO = 15;

type Linha = Record<string, string>;
interface ProdutoFeed {
  id: string;
  store: StoreId;
  title: string;
  titleNorm: string;
  brand?: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
  affiliateUrl: string;
  inStock: boolean;
  freeShipping?: boolean;
}

let cache: Promise<Map<string, ProdutoFeed>> | null = null;

/** CSV simples com aspas (o formato que a Awin exporta). */
function lerCsv(texto: string): Linha[] {
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') (campo += '"'), i++;
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") linha.push(campo), (campo = "");
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo), linhas.push(linha), (linha = []), (campo = "");
    } else campo += c;
  }
  if (campo || linha.length) linha.push(campo), linhas.push(linha);
  const [cabecalho, ...dados] = linhas.filter((l) => l.some(Boolean));
  if (!cabecalho) return [];
  const nomes = cabecalho.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return dados.map((l) => Object.fromEntries(nomes.map((n, i) => [n, l[i] ?? ""])));
}

async function baixarTexto(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`${res.status} em ${url.split("/apikey/")[0]}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // Feeds costumam vir em gzip; a lista vem em texto puro.
  return buf[0] === 0x1f && buf[1] === 0x8b ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
}

const numero = (v?: string) => {
  const n = Number((v ?? "").replace(/[^\d.,-]/g, "").replace(/,(?=\d{1,2}$)/, ".").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Baixa (uma vez por execução) os feeds das lojas de esporte em que você está aprovado. */
function catalogo(): Promise<Map<string, ProdutoFeed>> {
  cache ??= (async () => {
    const chave = process.env.AWIN_FEED_API_KEY!;
    const feeds = lerCsv(await baixarTexto(LISTA(chave)));
    const produtos = new Map<string, ProdutoFeed>();
    for (const f of feeds) {
      const anunciante = f.advertiser_name ?? "";
      const store = LOJAS.find(([re]) => re.test(anunciante))?.[1];
      const aprovado = ["active", "joined"].includes((f.membership_status ?? "").trim().toLowerCase());
      if (!store || !f.url) continue;
      if (!aprovado) {
        aviso(`Awin: feed de ${anunciante} aparece, mas você ainda não foi aprovado nesse programa.`);
        continue;
      }
      try {
        for (const l of lerCsv(await baixarTexto(f.url))) {
          const price = numero(l.search_price) ?? numero(l.store_price);
          const oldPrice = numero(l.product_price_old) ?? numero(l.rrp_price);
          const imageUrl = l.merchant_image_url || l.aw_image_url;
          if (!price || !l.product_name || !imageUrl || !l.aw_deep_link || !l.aw_product_id) continue;
          produtos.set(PREFIXO + l.aw_product_id, {
            id: PREFIXO + l.aw_product_id,
            store,
            title: l.product_name,
            titleNorm: normalize(l.product_name),
            brand: l.brand_name || undefined,
            price,
            oldPrice: oldPrice && oldPrice > price ? oldPrice : undefined,
            imageUrl: imageUrl.replace(/^http:/, "https:"),
            affiliateUrl: l.aw_deep_link,
            inStock: !/^(0|false|no|n)$/i.test(l.in_stock ?? "1"),
            freeShipping: l.delivery_cost?.trim() && Number(l.delivery_cost.replace(",", ".")) === 0 ? true : undefined,
          });
        }
        console.log(`  Awin: feed de ${anunciante} lido (${produtos.size} produtos até agora)`);
      } catch (e) {
        aviso(`Awin: não deu para baixar o feed de ${anunciante}: ${(e as Error).message}`);
      }
    }
    return produtos;
  })();
  return cache;
}

function paraOferta(p: ProdutoFeed, categoria: CategorySlug): Oferta {
  return {
    id: p.id,
    title: p.title,
    brand: p.brand,
    category: categoria,
    store: p.store,
    price: p.price,
    oldPrice: p.oldPrice,
    imageUrl: p.imageUrl,
    affiliateUrl: p.affiliateUrl,
    freeShipping: p.freeShipping,
  };
}

export const awin: AdaptadorLoja = {
  prefixo: PREFIXO,
  nome: "Awin (Netshoes, Centauro...)",

  motivoDesligado() {
    return process.env.AWIN_FEED_API_KEY ? null : "defina AWIN_FEED_API_KEY (chave de feeds da Awin, após aprovação nas lojas)";
  },

  async buscarOfertas(categoria) {
    const produtos = [...(await catalogo()).values()].filter((p) => p.inStock && descontoPercentual(p.price, p.oldPrice) >= DESCONTO_MINIMO);
    const ofertas = new Map<string, Oferta>();
    for (const termo of termosDaRodada(termosDe(categoria))) {
      const palavras = normalize(termo).split(/\s+/).filter((w) => w.length > 2);
      const achados = produtos
        .filter((p) => !ofertas.has(p.id) && palavras.every((w) => p.titleNorm.includes(w.slice(0, Math.max(4, w.length - 1)))))
        .sort((a, b) => descontoPercentual(b.price, b.oldPrice) - descontoPercentual(a.price, a.oldPrice))
        .slice(0, POR_TERMO);
      for (const p of achados) ofertas.set(p.id, paraOferta(p, categoria));
    }
    return [...ofertas.values()];
  },

  async verificarOferta(id): Promise<Verificacao> {
    try {
      const p = (await catalogo()).get(id);
      if (!p) return { status: "indisponivel", motivo: "saiu do feed da loja" };
      if (!p.inStock) return { status: "indisponivel", motivo: "sem estoque" };
      return { status: "ok", price: p.price, oldPrice: p.oldPrice, freeShipping: p.freeShipping, affiliateUrl: p.affiliateUrl };
    } catch (e) {
      return { status: "erro", motivo: (e as Error).message };
    }
  },
};
