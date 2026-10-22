import { categories } from "../../src/data/catalog";
import type { CategorySlug } from "../../src/types/product";

/**
 * O que procurar em cada categoria do site. Edite à vontade: cada termo vira uma busca em cada loja.
 * Termos curtos e comuns trazem mais resultados. O departamento (roupas, calçados...) e o tipo
 * (legging, cropped...) vêm do título do produto; a categoria aqui é só o esporte.
 */

// ---------- Roupas femininas ----------
const femininoAcademia = [
  "legging", "legging cintura alta", "legging com bolso", "calça legging fitness", "top fitness", "top nadador",
  "sutiã esportivo", "cropped fitness", "blusa cropped academia", "regata fitness feminina", "camiseta feminina academia",
  "blusa manga longa feminina academia", "short fitness feminino", "short saia fitness", "bermuda ciclista feminina",
  "macaquinho fitness", "macacão fitness", "conjunto fitness feminino", "conjunto legging e top",
];
const femininoCorrida = [
  "short feminino corrida", "regata feminina dry fit", "camiseta dry fit feminina", "jaqueta corta vento feminina",
  "calça legging de compressão feminina", "short de compressão feminino",
];
const femininoCasual = [
  "moletom feminino", "calça moletom feminina", "calça jogger feminina", "jaqueta esportiva feminina",
  "conjunto moletom feminino", "blusa de frio feminina", "camiseta oversized feminina",
];

// ---------- Roupas masculinas ----------
const masculinoAcademia = [
  "camiseta masculina academia", "camiseta dry fit masculina", "regata masculina academia", "regata cavada masculina",
  "camisa de compressão masculina", "camisa segunda pele masculina", "camiseta manga longa masculina academia",
  "bermuda academia masculina", "bermuda de compressão masculina", "short masculino academia", "calça de compressão masculina",
];
const masculinoCorrida = [
  "short masculino corrida", "short 2 em 1 masculino", "camiseta corrida masculina", "jaqueta corta vento masculina",
  "regata corrida masculina",
];
const masculinoCasual = [
  "moletom masculino", "calça moletom masculina", "calça jogger masculina", "bermuda moletom masculina",
  "agasalho esportivo masculino", "conjunto agasalho masculino", "jaqueta esportiva masculina", "camisa polo esportiva",
  "camiseta oversized masculina",
];

// ---------- Marcas (o catálogo do ML tem muitos produtos de marca com preço "de") ----------
const marcas = [
  "legging nike", "legging adidas", "legging live", "top nike", "camiseta nike dri-fit", "camiseta adidas",
  "camiseta under armour", "camiseta puma", "short nike", "short adidas", "bermuda olympikus", "camiseta olympikus",
  "camiseta fila", "short mizuno", "jaqueta adidas", "moletom nike",
];

const termosPorCategoria: Record<CategorySlug, string[]> = {
  futebol: [
    "chuteira society", "chuteira futsal", "chuteira campo", "bola de futebol", "camisa de time", "camisa de time feminina",
    "calção de futebol", "meião de futebol", "caneleira", "luva de goleiro",
  ],
  corrida: [
    // calçados
    "tênis feminino corrida", "tênis masculino corrida",
    // roupas
    ...femininoCorrida, ...masculinoCorrida, "meia esportiva cano curto",
    // acessórios
    "relógio gps", "cinto de hidratação", "viseira corrida",
  ],
  raquetes: ["raquete de tênis", "raquete de beach tennis", "raquete de padel", "bola de beach tennis", "bola de tênis", "saia de tênis feminina"],
  musculacao: [
    ...femininoAcademia, ...masculinoAcademia,
    "tênis feminino academia", "tênis masculino academia",
    // acessórios e equipamentos
    "bolsa academia feminina", "garrafa térmica", "luva de academia", "halter", "kettlebell", "elástico extensor treino", "tapete yoga",
    // lutas e natação (sem categoria própria no site; o departamento vem do tipo do produto)
    "luva de boxe", "óculos de natação",
  ],
  suplementos: ["whey protein", "creatina", "pré-treino", "coqueteleira"],
  recuperacao: [
    // lesão e suportes
    "joelheira", "tornozeleira", "munhequeira", "fita kinesio", "cinta lombar",
    // alívio e compressão
    "bolsa de gelo", "meia de compressão", "rolo liberação miofascial", "pistola massageadora",
  ],
  casual: [
    ...femininoCasual, ...masculinoCasual, ...marcas,
    "tênis casual feminino", "tênis casual masculino", "chinelo slide", "boné", "mochila",
    // vôlei e basquete (sem categoria própria no site)
    "bola de vôlei", "bola de basquete",
  ],
};

/** Só as categorias que existem em src/data/catalog.ts. */
export const categoriasDoSite: CategorySlug[] = categories.map((c) => c.slug);

export function termosDe(categoria: CategorySlug): string[] {
  return [...new Set(termosPorCategoria[categoria] ?? [])];
}

/**
 * Rodízio: cada execução busca só uma parte dos termos (RODIZIO partes), para a rodada caber no
 * tempo do GitHub Actions. Em algumas horas todos os termos passam. Para buscar tudo de uma vez
 * (ex.: rodando no computador), use BOT_RODIZIO=1.
 */
const RODIZIO = Math.max(1, Number(process.env.BOT_RODIZIO ?? 3));
export function termosDaRodada(termos: string[], agora = Date.now()): string[] {
  if (RODIZIO === 1) return termos;
  const parte = Math.floor(agora / 3_600_000) % RODIZIO;
  return termos.filter((_, i) => i % RODIZIO === parte);
}

export function ehCategoriaDoSite(slug: string): slug is CategorySlug {
  return (categoriasDoSite as string[]).includes(slug);
}