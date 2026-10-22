import { categories } from "../../src/data/catalog";
import type { CategorySlug } from "../../src/types/product";

/**
 * O que procurar em cada categoria do site. Edite à vontade: cada termo vira uma busca em cada loja.
 * Termos curtos e comuns trazem mais resultados.
 */
const termosPorCategoria: Record<CategorySlug, string[]> = {
  futebol: ["chuteira society", "chuteira futsal", "chuteira campo", "bola de futebol", "camisa de time", "caneleira", "luva de goleiro"],
  corrida: [
    // calçados
    "tênis feminino corrida", "tênis masculino corrida",
    // roupas
    "short feminino corrida", "short masculino corrida", "camiseta dry fit masculina", "regata feminina dry fit",
    "jaqueta corta vento feminina", "jaqueta corta vento masculina",
    // acessórios
    "relógio gps", "cinto de hidratação", "viseira corrida",
  ],
  raquetes: ["raquete de tênis", "raquete de beach tennis", "raquete de padel", "bola de beach tennis", "bola de tênis"],
  musculacao: [
    // roupas e calçados femininos
    "legging feminina", "top fitness", "short feminino academia", "conjunto fitness feminino", "macaquinho fitness",
    "tênis feminino academia",
    // roupas masculinas
    "bermuda academia masculina", "regata masculina academia",
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
    "tênis casual feminino", "tênis casual masculino", "moletom feminino", "moletom masculino", "boné", "mochila",
    // vôlei e basquete (sem categoria própria no site)
    "bola de vôlei", "bola de basquete",
  ],
};

/** Só as categorias que existem em src/data/catalog.ts. */
export const categoriasDoSite: CategorySlug[] = categories.map((c) => c.slug);

export function termosDe(categoria: CategorySlug): string[] {
  return termosPorCategoria[categoria] ?? [];
}

export function ehCategoriaDoSite(slug: string): slug is CategorySlug {
  return (categoriasDoSite as string[]).includes(slug);
}
