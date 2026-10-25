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
// Blusas, frio, shorts e calças femininas (mais variedade para ela)
const femininoBlusasECalcas = [
  "blusa esportiva feminina", "blusa de frio esportiva feminina", "blusa térmica feminina", "blusa dry fit feminina manga longa",
  "moletom esportivo feminino", "jaqueta de treino feminina", "jaqueta corta vento feminina com capuz", "agasalho esportivo feminino",
  "short esportivo feminino", "calça esportiva feminina", "calça de treino feminina", "calça flare fitness", "bermuda fitness feminina",
  "top esportivo alta sustentação", "legging sem costura", "legging estampada", "conjunto fitness sem costura", "body fitness",
  "regata nadador feminina", "camiseta dry fit feminina academia", "meia esportiva feminina", "bolsa esportiva feminina",
  "tênis feminino corrida nike", "tênis feminino corrida adidas", "tênis feminino asics", "tênis feminino olympikus",
  "tênis feminino mizuno", "maiô natação", "luva academia feminina",
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
// Blusas, frio, shorts e calças masculinas
const masculinoBlusasECalcas = [
  "blusa esportiva masculina", "blusa de frio esportiva masculina", "blusa térmica masculina", "blusa dry fit masculina manga longa",
  "moletom esportivo masculino", "jaqueta de treino masculina", "agasalho de treino masculino",
  "short esportivo masculino", "short tactel masculino", "calça esportiva masculina", "calça de treino masculina",
  "bermuda de treino masculina", "calça de moletom esportiva",
];

// ---------- Marcas (o catálogo do ML tem muitos produtos de marca com preço "de") ----------
const marcas = [
  "legging nike", "legging adidas", "legging live", "top nike", "camiseta nike dri-fit", "camiseta adidas",
  "camiseta under armour", "camiseta puma", "short nike", "short adidas", "bermuda olympikus", "camiseta olympikus",
  "camiseta fila", "short mizuno", "jaqueta adidas", "moletom nike",
];

const termosPorCategoria: Record<CategorySlug, string[]> = {
  futebol: [
    // chuteiras: tipo de campo x marca
    "chuteira society", "chuteira futsal", "chuteira campo", "chuteira society nike", "chuteira society adidas",
    "chuteira society puma", "chuteira society umbro", "chuteira society penalty", "chuteira society mizuno",
    "chuteira futsal nike", "chuteira futsal adidas", "chuteira futsal umbro", "chuteira futsal penalty", "chuteira futsal joma",
    "chuteira campo nike", "chuteira campo adidas", "chuteira campo puma", "chuteira campo mizuno", "chuteira campo umbro",
    "chuteira mercurial", "chuteira phantom", "chuteira predator", "chuteira feminina",
    // chuteira de trava (campo)
    "chuteira de trava", "chuteira trava mista", "chuteira campo trava", "chuteira campo penalty", "chuteira campo joma",
    "chuteira campo topper", "chuteira campo feminina", "chuteira society feminina",
    // bolas, roupas e acessórios
    "bola de futebol", "bola futsal", "bola society", "bola de futebol nike", "bola de futebol adidas", "bola de futebol penalty",
    "camisa de time", "camisa de time feminina", "camisa seleção brasileira", "calção de futebol", "meião de futebol",
    "caneleira", "luva de goleiro", "bolsa para chuteira",
  ],
  corrida: [
    // tênis de corrida: gênero x marca
    "tênis feminino corrida", "tênis masculino corrida", "tênis de corrida nike", "tênis de corrida adidas",
    "tênis de corrida asics", "tênis de corrida mizuno", "tênis de corrida olympikus", "tênis de corrida fila",
    "tênis de corrida new balance", "tênis de corrida under armour", "tênis de corrida puma", "tênis de corrida hoka",
    "tênis de corrida saucony", "tênis de corrida brooks", "tênis de corrida diadora", "tênis de corrida kalenji",
    "tênis nike pegasus", "tênis asics gel", "tênis mizuno wave", "tênis olympikus corre", "tênis adidas ultraboost",
    "tênis de caminhada feminino", "tênis de caminhada masculino", "tênis trail running",
    // roupas
    ...femininoCorrida, ...masculinoCorrida, "meia esportiva cano curto", "meia de corrida",
    // acessórios
    "relógio gps", "relógio garmin", "smartwatch esportivo", "cinto de hidratação", "pochete de corrida",
    "braçadeira celular corrida", "viseira corrida", "boné de corrida", "óculos de sol esportivo", "garrafa squeeze",
  ],
  raquetes: [
    "raquete de tênis", "raquete de tênis wilson", "raquete de tênis babolat", "raquete de tênis head",
    "raquete de beach tennis", "raquete beach tennis drop shot", "raquete beach tennis heroes", "raquete beach tennis camewin",
    "raquete de padel", "raquete de tênis de mesa", "bola de beach tennis", "bola de tênis", "bola de padel",
    "raqueteira", "overgrip", "tênis para quadra", "saia de tênis feminina",
  ],
  musculacao: [
    ...femininoAcademia, ...masculinoAcademia, ...femininoBlusasECalcas, ...masculinoBlusasECalcas,
    "tênis feminino academia", "tênis masculino academia", "tênis de treino cross",
    // acessórios e equipamentos
    "bolsa academia feminina", "mochila academia", "garrafa térmica", "coqueteleira", "luva de academia", "strap musculação",
    "cinto de musculação", "munhequeira academia", "faixa de cabelo esportiva", "toalha academia",
    "halter", "anilha", "kettlebell", "caneleira de peso", "elástico extensor treino", "mini band", "tapete yoga",
    "corda de pular", "roda abdominal", "bola de pilates",
    // lutas e natação (sem categoria própria no site; o departamento vem do tipo do produto)
    "luva de boxe", "bandagem boxe", "óculos de natação", "touca de natação",
  ],
  suplementos: ["whey protein", "creatina", "pré-treino", "coqueteleira", "albumina", "bcaa", "colágeno", "multivitamínico"],
  recuperacao: [
    // lesão e suportes
    "joelheira", "joelheira ortopédica", "tornozeleira", "tornozeleira ortopédica", "munhequeira", "cotoveleira",
    "fita kinesio", "cinta lombar", "corretor postural",
    // alívio e compressão
    "bolsa de gelo", "bolsa térmica gel", "meia de compressão", "manguito de compressão", "rolo liberação miofascial",
    "pistola massageadora", "bola de massagem",
  ],
  casual: [
    ...femininoCasual, ...masculinoCasual, ...marcas,
    "tênis casual feminino", "tênis casual masculino", "tênis branco feminino", "tênis branco masculino",
    "tênis nike air force", "tênis adidas", "tênis puma", "tênis fila", "tênis new balance", "tênis vans", "tênis all star",
    "chinelo slide", "chinelo nike", "chinelo adidas", "boné", "boné nike", "boné aba curva", "mochila", "mochila nike",
    // vôlei e basquete (sem categoria própria no site)
    "bola de vôlei", "bola de basquete", "tênis de basquete", "tênis de vôlei",
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