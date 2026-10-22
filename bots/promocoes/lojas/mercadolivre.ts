import { departmentOf, inferColors, inferGender, inferKind, normalize } from "../../../src/lib/classify";
import type { CategorySlug, ColorSlug, Gender, KindSlug } from "../../../src/types/product";
import { termosDaRodada, termosDe } from "../categorias";
import { aviso, buscarJson, ErroHttp, type AdaptadorLoja, type Oferta, type Verificacao } from "../tipos";

/**
 * Mercado Livre — API oficial (https://developers.mercadolivre.com.br), site MLB.
 * Autenticação: ML_CLIENT_ID + ML_CLIENT_SECRET (app grátis, fluxo client_credentials).
 * O app precisa da permissão "Publicação e sincronização: Leitura".
 *
 * Para apps novos o ML libera o catálogo, mas não a busca de anúncios nem /items. Por isso o fluxo é:
 *   /products/search (catálogo) -> /products/{id}/items (ofertas dos vendedores) -> /users/{id} (reputação).
 * Avaliações e estoque não são liberados: ficam como "indisponível" na avaliação, nunca chutados.
 * Link de afiliado: ML_AFFILIATE_TAG (matt_word) e ML_AFFILIATE_TOOL (matt_tool).
 */
const API = "https://api.mercadolibre.com";
const PREFIXO = "mercadolivre-";
const PREFIXO_PRODUTO = "mercadolivre-p-";
/** Produtos do catálogo analisados por termo de busca (cada um custa 1 chamada de preço). */
const PRODUTOS_POR_TERMO = 25;

interface ProdutoCatalogo {
  id: string;
  name: string;
  domain_id?: string;
  parent_id?: string | null;
  children_ids?: string[];
  pictures?: { url: string }[];
  attributes?: { id: string; value_name?: string | null }[];
}

interface OfertaVendedor {
  item_id: string;
  seller_id: number;
  price: number;
  original_price?: number | null;
  condition?: string;
  official_store_id?: number | null;
  shipping?: { free_shipping?: boolean };
}

interface UsuarioML {
  seller_reputation?: { level_id?: string | null; power_seller_status?: string | null };
}

let tokenCache: string | undefined;
let avisouSemTag = false;
/** Vendedor da oferta escolhida em cada produto (para buscar a reputação só das candidatas). */
const vendedorDe = new Map<string, number>();
const reputacaoCache = new Map<number, UsuarioML["seller_reputation"] | null>();
/** Famílias de produto já usadas nesta execução (cores/tamanhos do mesmo modelo não viram ofertas repetidas). */
const familiasVistas = new Set<string>();
/** Variações consultadas por produto "pai" (cada uma custa 1 chamada). */
const VARIACOES_POR_PRODUTO = 2;

const normalizar = normalize;

/** Tipos de produto que não são artigo esportivo, mesmo aparecendo nas buscas (lembrancinhas, decoração...). */
const NAO_ESPORTIVOS = ["chaveiro", "miniatura", "adesivo", "caneca", "quadro", "poster", "capinha", "boneco", "brinquedo", "imã", "ima", "chaveirinho", "pelucia", "bolo", "topo", "moldura", "prende", "calcador", "cabide"];

/** Em qualquer lugar do nome: produtos infantis/bebê e acessórios de roupa social não entram (o site é de esporte adulto). */
const PALAVRAS_PROIBIDAS = /\b(bebe|bebes|baby|infantil|recem nascido|menina|menino|kids|juvenil|social|moldura|prende camisa|calcador)\b/;

/** Tipos de produto do catálogo do ML (domain_id) que nunca entram. */
const DOMINIOS_BLOQUEADOS = /BOOK|KEYCHAIN|STICKER|MUG|POSTER|PAINTING|TOY|DOLL|CELLPHONE|PHONE_CASE|MAGNET|PARTY|CAKE|BODY_SHAPER|HANGER|UNDERWEAR|LINGERIE/;

/**
 * Relevância: a palavra principal do termo precisa aparecer entre as primeiras palavras do nome
 * (evita "Chaveiro Camisa Time" na busca "camisa de time"), e o produto precisa ser do mesmo
 * departamento do que foi pedido (evita kit de whey na busca "camiseta dry fit").
 * O tipo vem sempre do classify() do site, para o bot e o site concordarem.
 */
function relevante(nome: string, termo: string, dominio: string | undefined, tipo: KindSlug): boolean {
  if (dominio && DOMINIOS_BLOQUEADOS.test(dominio)) return false;
  const primeiras = normalizar(nome).split(/[^a-z0-9]+/).filter(Boolean).slice(0, 2);
  if (primeiras.some((p) => NAO_ESPORTIVOS.includes(p))) return false;
  if (PALAVRAS_PROIBIDAS.test(normalizar(nome))) return false;
  const tipoPedido = inferKind(termo);
  if (tipoPedido !== "outro" && tipo !== "outro" && departmentOf({ kind: tipoPedido, title: termo }) !== departmentOf({ kind: tipo, title: nome })) return false;
  const principal = normalizar(termo).split(/[^a-z0-9]+/).filter(Boolean)[0] ?? "";
  const inicio = normalizar(nome).split(/[^a-z0-9]+/).filter(Boolean).slice(0, 4);
  return inicio.some((p) => p.startsWith(principal.slice(0, Math.max(4, principal.length - 1))));
}

async function token(): Promise<string> {
  if (process.env.ML_ACCESS_TOKEN) return process.env.ML_ACCESS_TOKEN;
  if (tokenCache) return tokenCache;
  const corpo = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.ML_CLIENT_ID ?? "",
    client_secret: process.env.ML_CLIENT_SECRET ?? "",
  });
  const r = await buscarJson<{ access_token: string }>(`${API}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: corpo,
  });
  return (tokenCache = r.access_token);
}

async function api<T>(caminho: string): Promise<T> {
  return buscarJson<T>(`${API}${caminho}`, { headers: { authorization: `Bearer ${await token()}`, accept: "application/json" } });
}

/** Acrescenta os parâmetros do programa de afiliados ao link do produto. */
export function linkAfiliadoML(permalink: string): string {
  const tag = process.env.ML_AFFILIATE_TAG;
  if (!tag) {
    if (!avisouSemTag) aviso("ML_AFFILIATE_TAG não definida: links do Mercado Livre vão sem comissão.");
    avisouSemTag = true;
    return permalink;
  }
  const url = new URL(permalink);
  url.searchParams.set("matt_word", tag);
  if (process.env.ML_AFFILIATE_TOOL) url.searchParams.set("matt_tool", process.env.ML_AFFILIATE_TOOL);
  return url.toString();
}

/** Página do produto no catálogo já apontando para a oferta escolhida. */
function linkProduto(produtoId: string, itemId: string) {
  return linkAfiliadoML(`https://www.mercadolivre.com.br/p/${produtoId}?pdp_filters=item_id:${itemId}`);
}

type Atributos = { id: string; value_name?: string | null }[];

const atributo = (attrs: Atributos | undefined, ...ids: string[]) =>
  attrs?.find((a) => ids.includes(a.id) && a.value_name)?.value_name ?? undefined;

function marca(attrs?: Atributos): string | undefined {
  return atributo(attrs, "BRAND");
}

/** Gênero informado pelo vendedor no catálogo (atributo GENDER). Mais confiável que o título. */
function generoML(attrs?: Atributos): Gender | undefined {
  const g = normalize(atributo(attrs, "GENDER") ?? "");
  if (!g) return undefined;
  if (/femin|mulher|menina/.test(g)) return "feminino";
  if (/mascul|homem|menino/.test(g)) return "masculino";
  if (/unissex|sem genero|neutro/.test(g)) return "unissex";
  return undefined;
}

/** Cores do atributo COLOR/MAIN_COLOR (ex.: "Azul-marinho" -> azul). */
function coresML(attrs?: Atributos): ColorSlug[] | undefined {
  const c = atributo(attrs, "COLOR", "MAIN_COLOR");
  const cores = c ? inferColors(c) : [];
  return cores.length ? cores : undefined;
}

/** Gênero pedido no próprio termo de busca ("legging feminina" -> feminino). */
function generoDoTermo(termo: string): Gender | undefined {
  const g = inferGender(termo, "outro");
  return g === "unissex" ? undefined : g;
}

/** "5_green" -> 5 ... "1_red" -> 1. */
function nivel(levelId?: string | null): number | undefined {
  const n = Number(levelId?.charAt(0));
  return n >= 1 && n <= 5 ? n : undefined;
}

async function reputacao(sellerId: number) {
  if (!reputacaoCache.has(sellerId)) {
    const u = await api<UsuarioML>(`/users/${sellerId}`).catch(() => null);
    reputacaoCache.set(sellerId, u?.seller_reputation ?? null);
  }
  return reputacaoCache.get(sellerId) ?? undefined;
}

/**
 * Melhor oferta de um produto: a mais barata entre as novas que informam preço "de".
 * Sem preço "de" não há como calcular desconto, então a oferta não serve.
 */
async function melhorOferta(produtoId: string): Promise<OfertaVendedor | null> {
  const r = await api<{ results: OfertaVendedor[] }>(`/products/${produtoId}/items?limit=20`);
  const novas = r.results.filter((o) => (o.condition ?? "new") === "new" && o.original_price && o.original_price > o.price);
  return novas.sort((a, b) => a.price - b.price)[0] ?? null;
}

async function buscarPorTermo(termo: string, categoria: CategorySlug): Promise<Oferta[]> {
  const params = new URLSearchParams({ status: "active", site_id: "MLB", q: termo, limit: String(PRODUTOS_POR_TERMO) });
  const busca = await api<{ results: ProdutoCatalogo[] }>(`/products/search?${params}`);
  const ofertas: Oferta[] = [];
  const generoPedido = generoDoTermo(termo);
  for (const p of busca.results) {
    const imagem = p.pictures?.[0]?.url?.replace(/^http:/, "https:");
    const kind = inferKind(p.name);
    if (!imagem || !relevante(p.name, termo, p.domain_id, kind)) continue;
    const familia = p.parent_id || p.id;
    if (familiasVistas.has(familia)) continue;
    // Gênero: atributo do catálogo primeiro, título como reserva. Busca "feminina" não aceita produto masculino.
    const gender = generoML(p.attributes) ?? inferGender(p.name, kind);
    if (generoPedido && gender !== "unissex" && gender !== generoPedido) continue;

    // Produto "pai" não tem ofertas: os preços ficam nas variações (cor/tamanho).
    const candidatos = p.children_ids?.length ? p.children_ids.slice(0, VARIACOES_POR_PRODUTO) : [p.id];
    let melhor: { produtoId: string; oferta: OfertaVendedor } | null = null;
    for (const produtoId of candidatos) {
      const o = await melhorOferta(produtoId).catch(() => null);
      if (o && (!melhor || o.price < melhor.oferta.price)) melhor = { produtoId, oferta: o };
    }
    if (!melhor) continue;
    familiasVistas.add(familia);
    const o = melhor.oferta;
    const id = PREFIXO_PRODUTO + melhor.produtoId;
    vendedorDe.set(id, o.seller_id);
    ofertas.push({
      id,
      title: p.name,
      brand: marca(p.attributes),
      category: categoria,
      gender,
      kind,
      colors: coresML(p.attributes) ?? inferColors(p.name),
      store: "mercadolivre",
      price: o.price,
      oldPrice: o.original_price!,
      imageUrl: imagem,
      affiliateUrl: linkProduto(melhor.produtoId, o.item_id),
      freeShipping: o.shipping?.free_shipping || undefined,
      sinais: { condicao: o.condition ?? "new", lojaOficial: o.official_store_id ? true : undefined },
    });
  }
  return ofertas;
}

export const mercadoLivre: AdaptadorLoja = {
  prefixo: PREFIXO,
  nome: "Mercado Livre",

  motivoDesligado() {
    if (process.env.ML_ACCESS_TOKEN || (process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET)) return null;
    return "defina ML_CLIENT_ID e ML_CLIENT_SECRET (app grátis em developers.mercadolivre.com.br)";
  },

  async buscarOfertas(categoria) {
    const todas: Oferta[] = [];
    for (const termo of termosDaRodada(termosDe(categoria))) {
      try {
        todas.push(...(await buscarPorTermo(termo, categoria)));
      } catch (e) {
        aviso(`Mercado Livre, busca "${termo}": ${(e as Error).message}`);
      }
    }
    return todas;
  },

  async enriquecer(oferta) {
    const sellerId = vendedorDe.get(oferta.id);
    const rep = sellerId ? await reputacao(sellerId) : undefined;
    return {
      ...oferta,
      sinais: { ...oferta.sinais, nivelVendedor: nivel(rep?.level_id), medalhaVendedor: rep?.power_seller_status ?? undefined },
    };
  },

  async verificarOferta(id): Promise<Verificacao> {
    if (!id.startsWith(PREFIXO_PRODUTO)) return { status: "erro", motivo: "formato antigo de id; o ML não libera /items para este app" };
    const produtoId = id.slice(PREFIXO_PRODUTO.length);
    try {
      const o = await melhorOferta(produtoId);
      if (!o) return { status: "indisponivel", motivo: "nenhuma oferta nova com desconto" };
      vendedorDe.set(id, o.seller_id);
      return { status: "ok", price: o.price, oldPrice: o.original_price ?? undefined, freeShipping: o.shipping?.free_shipping, affiliateUrl: linkProduto(produtoId, o.item_id) };
    } catch (e) {
      if (e instanceof ErroHttp && e.status === 404) return { status: "indisponivel", motivo: "produto removido do catálogo" };
      return { status: "erro", motivo: (e as Error).message };
    }
  },
};
