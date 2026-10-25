import { gunzipSync } from "node:zlib";
import { inferColors, inferGender, inferKind, normalize } from "../../../src/lib/classify";
import type { CategorySlug, ColorSlug, Gender, ProductSize, StoreId } from "../../../src/types/product";
import { termosDaRodada, termosDe } from "../categorias";
import { aviso, DESCONTO_MINIMO, descontoPercentual, type AdaptadorLoja, type Oferta, type Verificacao } from "../tipos";

/**
 * Awin — rede de afiliados onde estão Nike, adidas, Centauro, Olympikus, ASICS, Mizuno, Decathlon,
 * PUMA, Dafiti, Fut Fanatics, Lauri Esporte e outras lojas de esporte.
 * Usa os feeds de produtos (CSV) que cada loja publica para os afiliados aprovados nela.
 *
 * Liga com AWIN_FEED_API_KEY: a chave de feeds (ui.awin.com > Ferramentas > Crie um Feed), que é
 * diferente do token da API do publisher. Só entram lojas em que você já foi aprovado na Awin;
 * as pendentes aparecem como aviso no relatório e entram sozinhas no dia em que forem aprovadas.
 *
 * Fluxo: lista de feeds -> baixa o feed de cada loja de esporte aprovada (uma vez por execução) ->
 * junta tamanhos/cores repetidos -> filtra o que não é esporte adulto -> procura pelos termos de cada
 * categoria, com desconto >= 15% e no máximo POR_LOJA ofertas de uma mesma loja por termo.
 * Gênero e cor vêm do próprio feed quando a loja informa; o resto o site deduz pelo título.
 * Link de afiliado: aw_deep_link, que já vem rastreado com o seu ID de publisher.
 */
const PREFIXO = "awin-";
/** ID de publisher da Simple Athletic na Awin (público: aparece em todo link de afiliado). */
const PUBLISHER = () => process.env.AWIN_PUBLISHER_ID || "3133181";
/** Lista de feeds no formato novo da Awin ("darwin"); a antiga fica de reserva. */
const LISTAS = (chave: string) => [
  `https://ui.awin.com/productdata-darwin-download/publisher/${PUBLISHER()}/${chave}/1/feedList`,
  `https://productdata.awin.com/datafeed/list/apikey/${chave}`,
];
/** Feed que a loja não atualiza há mais que isso fica de fora: preço velho no site não pode. */
const IDADE_MAXIMA_FEED_DIAS = 3;

/** Nome do anunciante na Awin -> loja do site. Lojas fora desta lista são ignoradas. */
export const LOJAS: [RegExp, StoreId][] = [
  [/netshoes/i, "netshoes"],
  [/centauro/i, "centauro"],
  [/decathlon/i, "decathlon"],
  [/magalu|magazine luiza/i, "magalu"],
  [/^nike\b/i, "nike"],
  [/adidas/i, "adidas"],
  [/^puma\b/i, "puma"],
  [/asics/i, "asics"],
  [/mizuno/i, "mizuno"],
  [/olympikus/i, "olympikus"],
  [/dafiti/i, "dafiti"],
  [/fut ?fanatics/i, "futfanatics"],
  [/lauri/i, "lauri"],
];

/** Lojas de moda geral: só entra o que for claramente esportivo (pela categoria da loja ou pelo nome). */
const LOJAS_DE_MODA = new Set<StoreId>(["dafiti", "magalu"]);
const ESPORTIVO = /\b(esporte|esportiv|fitness|academia|treino|corrida|running|futebol|chuteira|basquete|tenis de quadra|yoga|natacao|ciclismo|crossfit|dry ?fit|legging|top fitness|suplement)/;

/** Fora do site: infantil/bebê, roupa social e itens que não são de esporte. */
const PROIBIDAS = /\b(bebe|bebes|baby|infantil|infantis|kids|juvenil|menina|menino|recem nascido|social|lingerie|cueca|calcinha|sutia de renda|vestido de festa|chaveiro|caneca|adesivo|poster|miniatura)\b/;

/** Máximo de ofertas por termo de busca e, dentro dele, por loja — para nenhuma loja lotar o site sozinha. */
const POR_TERMO = 15;
const POR_LOJA = 5;

/** Desconto acima disso costuma ser erro de cadastro no feed ("de" inflado); fica de fora. */
const DESCONTO_MAXIMO = 85;

/** Colunas pedidas ao baixar cada feed (as que a Awin não tiver para a loja voltam vazias). */
const COLUNAS = [
  "aw_deep_link", "product_name", "aw_product_id", "merchant_product_id", "merchant_image_url", "aw_image_url",
  "large_image", "merchant_category", "category_name", "search_price", "store_price", "rrp_price",
  "product_price_old", "delivery_cost", "brand_name", "colour", "in_stock", "stock_quantity", "ean",
  "product_GTIN", "average_rating", "reviews", "Fashion:suitable_for", "Fashion:category",
].join(",");

export type Linha = Record<string, string>;
export interface ProdutoFeed {
  id: string;
  store: StoreId;
  title: string;
  titleNorm: string;
  /** Título + categoria da loja, normalizados: é onde a busca por termo procura. */
  busca: string;
  brand?: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
  affiliateUrl: string;
  inStock: boolean;
  freeShipping?: boolean;
  gender?: Gender;
  colors?: ColorSlug[];
  rating?: number;
  reviews?: number;
  ean?: string;
  /** Tamanho desta linha do feed (cada tamanho vem numa linha, com link e preço próprios). */
  size?: string;
  /** Agrupador da loja para as variações de um mesmo produto (item_group_id), quando existe. */
  group?: string;
  images?: string[];
  /** No representante: todos os tamanhos do produto, cada um com o próprio link e preço. */
  tamanhos?: ProductSize[];
}

let cache: Promise<Map<string, ProdutoFeed>> | null = null;

/** CSV simples com aspas (o formato que a Awin exporta). */
export function lerCsv(texto: string): Linha[] {
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
  // A chave vai no meio do endereço: nunca deixar ela aparecer em aviso (o relatório vai para o GitHub).
  if (!res.ok) throw new Error(`${res.status} em ${url.replace(/[0-9a-f]{32}/gi, "<chave>").split("/apikey/")[0]}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // Feeds costumam vir em gzip; a lista vem em texto puro.
  return buf[0] === 0x1f && buf[1] === 0x8b ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
}

/** Troca as colunas do link do feed pelas que o robô usa (gênero, cor, nota...). */
function comColunas(url: string): string {
  return /\/columns\/[^/]+/.test(url) ? url.replace(/\/columns\/[^/]+/, `/columns/${encodeURIComponent(COLUNAS)}`) : url;
}

export const numero = (v?: string) => {
  const n = Number((v ?? "").replace(/[^\d.,-]/g, "").replace(/,(?=\d{1,2}$)/, ".").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Gênero que a loja informou no feed (Fashion:suitable_for, categoria ou nome). */
function generoDoFeed(l: Linha, texto: string): Gender | undefined {
  const g = normalize(`${l["fashion:suitable_for"] ?? ""} ${l["fashion:category"] ?? ""} ${l.merchant_category ?? ""}`);
  const fem = /\b(female|feminin|mulher|women|womens)\b/.test(g);
  const masc = /\b(male|masculin|homem|men|mens)\b/.test(g.replace(/\bfemale\b/g, "").replace(/\bwomens?\b/g, ""));
  if (/\bunisex|unissex\b/.test(g) || (fem && masc)) return "unissex";
  if (fem) return "feminino";
  if (masc) return "masculino";
  const doTitulo = inferGender(texto);
  return doTitulo === "unissex" ? undefined : doTitulo;
}

/** Tamanhos e numerações saem do nome, para juntar as linhas de um mesmo produto. */
const semTamanho = (titulo: string) =>
  normalize(titulo)
    .replace(/\b(tam(anho)?|n[ºo]?|numero)\s*[\w/-]+/g, " ")
    .replace(/\b(pp|p|m|g|gg|xg|xgg|eg|egg|unico|u)\b/g, " ")
    .replace(/\b\d{2}(\/\d{2})?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Link rastreado da Awin para uma página da loja (o formato novo do feed traz o link direto da loja). */
export function linkRastreado(destino: string, anuncianteId: string): string {
  if (/awin1\.com|awclick/.test(destino)) return destino;
  return `https://www.awin1.com/cread.php?awinmid=${anuncianteId}&awinaffid=${PUBLISHER()}&ued=${encodeURIComponent(destino)}`;
}

/**
 * Feed no formato novo da Awin (padrão Google Shopping) -> mesmas colunas do formato antigo, para o resto
 * do conector não precisar saber de onde veio. Preço "199.90 BRL"; sale_price é o preço de promoção.
 */
export function normalizarLinhaGoogle(l: Linha, anuncianteId: string): Linha {
  const preco = numero(l.price);
  const promo = numero(l.sale_price);
  const emPromo = promo !== undefined && preco !== undefined && promo < preco;
  const link = l.aw_deep_link || l.link || "";
  return {
    aw_product_id: l.aw_product_id || l.id || "",
    product_name: l.title || "",
    aw_deep_link: link ? linkRastreado(link, anuncianteId) : "",
    merchant_image_url: l.image_link || "",
    alternate_images: l.additional_image_link || "",
    merchant_category: `${l.product_type ?? ""} ${l.google_product_category ?? ""}`.trim(),
    search_price: String(emPromo ? promo : (preco ?? "")),
    product_price_old: emPromo ? String(preco) : "",
    in_stock: /out of stock|esgotado|fora de estoque/i.test(l.availability ?? "") ? "0" : "1",
    brand_name: l.brand || "",
    colour: l.color || "",
    "fashion:size": l.size || "",
    "fashion:suitable_for": l.gender || "",
    ean: l.gtin || "",
    item_group_id: l.item_group_id || "",
  };
}

/** Tamanho que vem no fim do nome ("Camiseta Dry Fit Preta - G", "Tênis X Tam 40"). */
function tamanhoDoTitulo(titulo: string): string | undefined {
  const m = titulo.match(/(?:\btam(?:anho)?\.?\s*|[-–|]\s*|\s)((?:PP|P|M|G|GG|XG|XGG|EG|EGG|XS|S|L|XL|XXL)|(?:3[3-9]|4[0-8])(?:\/(?:3[4-9]|4[0-9]))?)\s*$/i);
  return m?.[1]?.toUpperCase();
}

const ORDEM_TAMANHOS = ["PP", "XS", "P", "S", "M", "G", "L", "GG", "XL", "XG", "XXL", "XGG", "EG", "EGG"];
function compararTamanhos(a: string, b: string) {
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  const ia = ORDEM_TAMANHOS.indexOf(a.toUpperCase());
  const ib = ORDEM_TAMANHOS.indexOf(b.toUpperCase());
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
}

/** Converte uma linha do feed num produto, ou null se faltar algo essencial ou não for esporte adulto. */
export function linhaParaProduto(l: Linha, store: StoreId): ProdutoFeed | null {
  const price = numero(l.search_price) ?? numero(l.store_price);
  const imageUrl = l.large_image || l.merchant_image_url || l.aw_image_url;
  if (!price || !l.product_name || !imageUrl || !l.aw_deep_link || !l.aw_product_id) return null;

  const titleNorm = normalize(l.product_name);
  const categoria = normalize(`${l.merchant_category ?? ""} ${l.category_name ?? ""} ${l["fashion:category"] ?? ""}`);
  if (PROIBIDAS.test(titleNorm) || PROIBIDAS.test(categoria)) return null;
  if (LOJAS_DE_MODA.has(store) && !ESPORTIVO.test(`${titleNorm} ${categoria}`)) return null;

  let oldPrice = numero(l.product_price_old) ?? numero(l.rrp_price);
  if (!oldPrice || oldPrice <= price || descontoPercentual(price, oldPrice) > DESCONTO_MAXIMO) oldPrice = undefined;

  const texto = `${l.product_name} ${l.merchant_category ?? ""}`;
  const cores = inferColors(`${l.colour ?? ""} ${l.product_name}`);
  const rating = numero(l.average_rating);
  const reviews = numero(l.reviews);
  return {
    id: PREFIXO + l.aw_product_id,
    store,
    title: l.product_name.trim(),
    titleNorm,
    busca: `${titleNorm} ${categoria}`,
    brand: l.brand_name?.trim() || undefined,
    price,
    oldPrice,
    imageUrl: imageUrl.replace(/^http:/, "https:"),
    affiliateUrl: l.aw_deep_link,
    inStock: !/^(0|false|no|n|out of stock)$/i.test((l.in_stock ?? "1").trim()) && l.stock_quantity?.trim() !== "0",
    freeShipping: l.delivery_cost?.trim() && Number(l.delivery_cost.replace(",", ".")) === 0 ? true : undefined,
    gender: generoDoFeed(l, texto),
    colors: cores.length ? cores : undefined,
    rating: rating && rating <= 5 ? rating : undefined,
    reviews: reviews ? Math.round(reviews) : undefined,
    ean: (l.ean || l.product_gtin || "").replace(/\D/g, "") || undefined,
    size: (l["fashion:size"] || "").trim() || tamanhoDoTitulo(l.product_name),
    group: l.item_group_id?.trim() || undefined,
    images: [imageUrl, ...(l.alternate_images ?? "").split(/[,|]\s*/), l.alternate_image ?? "", l.alternate_image_two ?? "", l.alternate_image_three ?? ""]
      .map((u) => u.trim().replace(/^http:/, "https:"))
      .filter((u, i, a) => u.startsWith("https://") && a.indexOf(u) === i)
      .slice(0, 7),
  };
}

const melhorDe = (a: ProdutoFeed, b: ProdutoFeed) => ((a.inStock && !b.inStock) || (a.inStock === b.inStock && a.price < b.price) ? a : b);

/** Tamanhos de um produto: um por etiqueta (o mais barato em estoque), cada um com o link e o preço da sua linha. */
function tamanhosDe(linhas: ProdutoFeed[]): ProductSize[] | undefined {
  const porEtiqueta = new Map<string, ProdutoFeed>();
  for (const p of linhas) {
    if (!p.size) continue;
    const k = p.size.toUpperCase();
    porEtiqueta.set(k, porEtiqueta.has(k) ? melhorDe(p, porEtiqueta.get(k)!) : p);
  }
  if (porEtiqueta.size < 2) return undefined;
  return [...porEtiqueta.entries()]
    .sort(([a], [b]) => compararTamanhos(a, b))
    .map(([label, p]) => ({ label, available: p.inStock, price: p.inStock ? p.price : undefined, url: p.inStock ? p.affiliateUrl : undefined }));
}

/**
 * Junta as linhas repetidas (uma por tamanho, na mesma loja e cor) e depois o mesmo produto em lojas
 * diferentes (mesmo EAN): fica o mais barato em estoque. O representante guarda todos os tamanhos.
 * Devolve o representante de cada id do feed, para a verificação continuar achando a oferta mesmo se
 * outro tamanho virar o mais barato.
 */
export function juntarRepetidos(produtos: ProdutoFeed[]): Map<string, ProdutoFeed> {
  const grupos = new Map<string, ProdutoFeed[]>();
  for (const p of produtos) {
    const k = p.group ? `${p.store}|g|${p.group}|${(p.colors ?? []).join(",")}` : `${p.store}|${semTamanho(p.title)}|${(p.colors ?? []).join(",")}`;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(p);
  }
  const repDe = new Map<ProdutoFeed, ProdutoFeed>();
  const reps: ProdutoFeed[] = [];
  for (const linhas of grupos.values()) {
    const rep = linhas.reduce(melhorDe);
    rep.tamanhos = tamanhosDe(linhas);
    reps.push(rep);
    for (const l of linhas) repDe.set(l, rep);
  }
  const porEan = new Map<string, ProdutoFeed>();
  for (const r of reps) if (r.ean) porEan.set(r.ean, porEan.has(r.ean) ? melhorDe(r, porEan.get(r.ean)!) : r);
  const final = (r: ProdutoFeed) => (r.ean ? porEan.get(r.ean)! : r);
  return new Map(produtos.map((p) => [p.id, final(repDe.get(p)!)]));
}

/** Escolhe as ofertas de um termo: maior desconto primeiro, no máximo POR_LOJA por loja. */
export function escolherDoTermo(produtos: ProdutoFeed[], termo: string, jaEscolhidos: Set<string>): ProdutoFeed[] {
  const palavras = normalize(termo).split(/\s+/).filter((w) => w.length > 2);
  const porLoja = new Map<StoreId, number>();
  const escolhidos: ProdutoFeed[] = [];
  const candidatos = produtos
    .filter((p) => !jaEscolhidos.has(p.id) && palavras.every((w) => p.busca.includes(w.slice(0, Math.max(4, w.length - 1)))))
    .sort((a, b) => descontoPercentual(b.price, b.oldPrice) - descontoPercentual(a.price, a.oldPrice));
  for (const p of candidatos) {
    const n = porLoja.get(p.store) ?? 0;
    if (n >= POR_LOJA) continue;
    porLoja.set(p.store, n + 1);
    escolhidos.push(p);
    if (escolhidos.length >= POR_TERMO) break;
  }
  return escolhidos;
}

/**
 * Baixa (uma vez por execução) os feeds das lojas de esporte em que você está aprovado.
 * Devolve id do feed -> produto representante (o mesmo objeto para todos os tamanhos de um produto).
 */
function catalogo(): Promise<Map<string, ProdutoFeed>> {
  cache ??= (async () => {
    const chave = process.env.AWIN_FEED_API_KEY!;
    let feeds: Linha[] = [];
    let erroLista: unknown;
    for (const lista of LISTAS(chave)) {
      try {
        feeds = lerCsv(await baixarTexto(lista));
        if (feeds.length) break;
      } catch (e) {
        erroLista = e;
      }
    }
    if (!feeds.length) throw erroLista ?? new Error("lista de feeds vazia");
    const lidos: ProdutoFeed[] = [];
    for (const f of feeds) {
      const anunciante = f.advertiser_name ?? "";
      const store = LOJAS.find(([re]) => re.test(anunciante))?.[1];
      const aprovado = /^(active|joined)$/i.test((f.membership_status ?? "").trim());
      if (!store || !f.url) continue;
      if (!aprovado) {
        aviso(`Awin: ${anunciante} ainda não aprovou sua entrada (o feed entra sozinho quando aprovar).`);
        continue;
      }
      // Preço velho não entra: feed que a loja não atualiza há dias fica de fora até ela atualizar.
      const importado = Date.parse(`${(f.last_imported ?? "").trim().replace(" ", "T")}Z`);
      if (!Number.isFinite(importado) || Date.now() - importado > IDADE_MAXIMA_FEED_DIAS * 24 * 60 * 60 * 1000) {
        aviso(`Awin: o catálogo de ${anunciante} não é atualizado desde ${f.last_imported || "(sem data)"}; fica fora do site até a loja atualizar (preço velho não pode).`);
        continue;
      }
      const google = /google/i.test(f.datafeed_format ?? "");
      try {
        let texto: string;
        try {
          texto = await baixarTexto(google ? f.url : comColunas(f.url));
        } catch {
          texto = await baixarTexto(f.url); // a loja não tem alguma das colunas extras: usa as padrão
        }
        let n = 0;
        for (const bruta of lerCsv(texto)) {
          const p = linhaParaProduto(google ? normalizarLinhaGoogle(bruta, f.advertiser_id ?? "") : bruta, store);
          if (p) lidos.push(p), n++;
        }
        console.log(`  Awin: feed de ${anunciante} lido (${n} produtos de esporte)`);
      } catch (e) {
        aviso(`Awin: não deu para baixar o feed de ${anunciante}: ${(e as Error).message}`);
      }
    }
    const representantes = juntarRepetidos(lidos);
    console.log(`  Awin: ${new Set(representantes.values()).size} produtos únicos depois de juntar tamanhos e lojas repetidas`);
    return representantes;
  })();
  return cache;
}

function paraOferta(p: ProdutoFeed, categoria: CategorySlug): Oferta {
  return {
    id: p.id,
    title: p.title,
    brand: p.brand,
    category: categoria,
    gender: p.gender,
    kind: inferKind(p.title),
    colors: p.colors,
    store: p.store,
    price: p.price,
    oldPrice: p.oldPrice,
    imageUrl: p.imageUrl,
    affiliateUrl: p.affiliateUrl,
    rating: p.rating,
    reviews: p.reviews,
    freeShipping: p.freeShipping,
  };
}

export const awin: AdaptadorLoja = {
  prefixo: PREFIXO,
  nome: "Awin (Nike, adidas, Centauro...)",

  motivoDesligado() {
    return process.env.AWIN_FEED_API_KEY ? null : "defina AWIN_FEED_API_KEY (chave de feeds da Awin, após aprovação nas lojas)";
  },

  async buscarOfertas(categoria) {
    const produtos = [...new Set((await catalogo()).values())].filter((p) => p.inStock && descontoPercentual(p.price, p.oldPrice) >= DESCONTO_MINIMO);
    const ofertas = new Map<string, Oferta>();
    for (const termo of termosDaRodada(termosDe(categoria))) {
      for (const p of escolherDoTermo(produtos, termo, new Set(ofertas.keys()))) ofertas.set(p.id, paraOferta(p, categoria));
    }
    return [...ofertas.values()];
  },

  /** Fotos e tamanhos vêm do próprio feed já baixado: não custa chamada extra, então é refeito a cada execução. */
  detalhesSemCusto: true,
  async detalhar(id) {
    const p = (await catalogo()).get(id);
    if (!p) return null;
    return { images: p.images?.length ? p.images : undefined, sizeLabel: p.tamanhos ? "Tamanho" : undefined, sizes: p.tamanhos };
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
