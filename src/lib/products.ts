import rawProducts from "@/data/products.json";
import type { CategorySlug, Product } from "@/types/product";

const all = rawProducts as Product[];

/** Ofertas que ainda valem: ativas e não expiradas. */
export function getActiveProducts(now = Date.now()): Product[] {
  return all.filter((p) => p.active && (!p.expiresAt || Date.parse(p.expiresAt) > now));
}

export function getProductById(id: string): Product | undefined {
  return all.find((p) => p.id === id);
}

export function getByCategory(slug: CategorySlug): Product[] {
  return sortByDiscount(getActiveProducts().filter((p) => p.category === slug));
}

export function discountOf(p: Product): number {
  if (!p.oldPrice || p.oldPrice <= p.price) return 0;
  return Math.round((1 - p.price / p.oldPrice) * 100);
}

/** Quanto o cliente economiza em reais. */
export function savingsOf(p: Product): number {
  return p.oldPrice && p.oldPrice > p.price ? p.oldPrice - p.price : 0;
}

/** Marcas com oferta ativa, da que tem mais ofertas para a que tem menos. */
export function getBrands(list = getActiveProducts()): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of list) if (p.brand) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function sortByDiscount(list: Product[]): Product[] {
  return [...list].sort((a, b) => discountOf(b) - discountOf(a));
}

export function searchProducts(query: string): Product[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return sortByDiscount(
    getActiveProducts().filter((p) => {
      const haystack = normalize(`${p.title} ${p.brand ?? ""} ${p.category}`);
      return terms.every((t) => haystack.includes(t));
    }),
  );
}

/** Ofertas cujo título tem pelo menos um dos termos (usado nos tipos de produto). */
export function searchAny(terms: string[], excludeCategories: CategorySlug[] = []): Product[] {
  const wanted = terms.map(normalize);
  return sortByDiscount(
    getActiveProducts().filter((p) => {
      if (excludeCategories.includes(p.category)) return false;
      const title = normalize(p.title);
      return wanted.some((t) => title.includes(t));
    }),
  );
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatPrice = (value: number) => brl.format(value);

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
