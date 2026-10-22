import rawProducts from "@/data/products.json";
import { infoOf } from "@/data/taxonomy";
import type { CategorySlug, ColorSlug, DepartmentSlug, GroupSlug, KindSlug, Product, StyleSlug } from "@/types/product";
import { classify, isForWomen, normalize } from "./classify";
import type { Mode } from "./mode";

export type ShopProduct = ReturnType<typeof classify<Product>>;

const all: ShopProduct[] = (rawProducts as Product[]).map(classify);

/** Ofertas que ainda valem (ativas e não expiradas), já filtradas pelo modo do site. */
export function getActiveProducts(mode: Mode = "todos", now = Date.now()): ShopProduct[] {
  return all.filter((p) => p.active && (!p.expiresAt || Date.parse(p.expiresAt) > now) && (mode === "todos" || isForWomen(p)));
}

export function getProductById(id: string): Product | undefined {
  return all.find((p) => p.id === id);
}

export function getByCategory(slug: CategorySlug, mode: Mode = "todos"): ShopProduct[] {
  return sortByDiscount(getActiveProducts(mode).filter((p) => p.category === slug));
}

export function departmentOf(p: ShopProduct): DepartmentSlug {
  return infoOf(p.kind).department;
}

export function groupOf(p: ShopProduct): GroupSlug | "outros" {
  return infoOf(p.kind).group;
}

export interface ShopFilter {
  department?: DepartmentSlug;
  group?: GroupSlug;
  kind?: KindSlug;
  color?: ColorSlug;
  style?: StyleSlug;
}

export function filterProducts(list: ShopProduct[], f: ShopFilter): ShopProduct[] {
  return list.filter(
    (p) =>
      (!f.department || departmentOf(p) === f.department) &&
      (!f.group || groupOf(p) === f.group) &&
      (!f.kind || p.kind === f.kind) &&
      (!f.color || p.colors.includes(f.color)) &&
      (!f.style || p.style === f.style),
  );
}

/** Quantas ofertas há de cada valor (tipo, cor...). Usado para mostrar só filtros que têm resultado. */
export function countBy<K extends string>(list: ShopProduct[], key: (p: ShopProduct) => K | K[]): Map<K, number> {
  const counts = new Map<K, number>();
  for (const p of list) for (const k of ([] as K[]).concat(key(p))) counts.set(k, (counts.get(k) ?? 0) + 1);
  return counts;
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
export function getBrands(list: Product[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of list) if (p.brand) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function sortByDiscount<T extends Product>(list: T[]): T[] {
  return [...list].sort((a, b) => discountOf(b) - discountOf(a));
}

export function searchProducts(query: string, mode: Mode = "todos"): ShopProduct[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return sortByDiscount(
    getActiveProducts(mode).filter((p) => {
      const haystack = normalize(`${p.title} ${p.brand ?? ""} ${p.category}`);
      return terms.every((t) => haystack.includes(t));
    }),
  );
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatPrice = (value: number) => brl.format(value);
