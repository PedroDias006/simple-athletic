import { categories } from "../../src/data/catalog";
import type { CategorySlug } from "../../src/types/product";

/**
 * O que procurar em cada categoria do site. Edite à vontade: cada termo vira uma busca em cada loja.
 * Termos curtos e comuns trazem mais resultados.
 */
const termosPorCategoria: Record<CategorySlug, string[]> = {
  futebol: ["chuteira society", "chuteira futsal", "chuteira campo", "bola de futebol", "camisa de time", "caneleira"],
  corrida: ["tênis de corrida", "tênis running masculino", "tênis running feminino", "relógio gps", "meia de corrida", "cinto de hidratação"],
  raquetes: ["raquete de beach tennis", "raquete de tênis", "raquete de padel", "bola de beach tennis"],
  musculacao: ["halter", "anilha", "kettlebell", "elástico extensor treino", "luva de academia"],
  suplementos: ["whey protein", "creatina", "pré-treino", "coqueteleira"],
  recuperacao: ["rolo liberação miofascial", "pistola massageadora", "meia de compressão", "bolsa de gelo"],
  casual: ["tênis casual masculino", "tênis casual feminino", "tênis branco", "moletom", "boné"],
};

/** Só as categorias que existem em src/data/catalog.ts. */
export const categoriasDoSite: CategorySlug[] = categories.map((c) => c.slug);

export function termosDe(categoria: CategorySlug): string[] {
  return termosPorCategoria[categoria] ?? [];
}

export function ehCategoriaDoSite(slug: string): slug is CategorySlug {
  return (categoriasDoSite as string[]).includes(slug);
}
