export type CategorySlug =
  | "futebol"
  | "corrida"
  | "raquetes"
  | "musculacao"
  | "suplementos"
  | "recuperacao"
  | "casual";

export type StoreId =
  | "mercadolivre"
  | "amazon"
  | "shopee"
  | "netshoes"
  | "centauro"
  | "decathlon"
  | "magalu";

/**
 * Formato de uma oferta em src/data/products.json.
 * O bot de promoções lê e reescreve esse arquivo; mantenha os campos estáveis.
 */
export interface Product {
  id: string;
  title: string;
  brand?: string;
  category: CategorySlug;
  store: StoreId;
  /** Preço atual em reais. */
  price: number;
  /** Preço "de", antes da promoção. */
  oldPrice?: number;
  imageUrl: string;
  /** Link de afiliado. O site sempre passa por /ir/[id], então ele pode mudar sem quebrar posts antigos. */
  affiliateUrl: string;
  rating?: number;
  reviews?: number;
  coupon?: string;
  freeShipping?: boolean;
  /** ISO 8601. Depois disso a oferta some do site. */
  expiresAt?: string;
  /** ISO 8601. Última vez que o bot confirmou o preço. */
  updatedAt: string;
  /** O bot marca false quando a promoção acaba ou o produto esgota. */
  active: boolean;
}
