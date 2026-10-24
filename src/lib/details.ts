import rawDetails from "@/data/details.json";
import type { ProductDetails } from "@/types/product";

/** Fotos extras e tamanhos que o bot de promoções conferiu na loja (src/data/details.json). */
const all = rawDetails as Record<string, ProductDetails>;

export function getDetails(id: string): ProductDetails | undefined {
  return all[id];
}
