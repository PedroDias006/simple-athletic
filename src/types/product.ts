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
  | "magalu"
  // Lojas da Awin (entram sozinhas quando o programa aprova e o feed tem ofertas)
  | "nike"
  | "adidas"
  | "puma"
  | "asics"
  | "mizuno"
  | "olympikus"
  | "dafiti"
  | "futfanatics"
  | "lauri";

export type Gender = "feminino" | "masculino" | "unissex";

// Departamentos, tipos e estilos vivem na árvore do catálogo (src/data/taxonomy.ts).
export type { DepartmentSlug, GroupSlug, KindSlug, StyleSlug } from "../data/taxonomy";
import type { KindSlug, StyleSlug } from "../data/taxonomy";

export type ColorSlug =
  | "preto" | "branco" | "cinza" | "azul" | "vermelho" | "verde" | "amarelo"
  | "laranja" | "rosa" | "roxo" | "bege" | "marrom" | "colorido";

/**
 * Formato de uma oferta em src/data/products.json.
 * O bot de promoções lê e reescreve esse arquivo; mantenha os campos estáveis.
 */
export interface Product {
  id: string;
  title: string;
  brand?: string;
  category: CategorySlug;
  /** Opcionais: quando faltam, o site deduz pelo título (src/lib/classify.ts). */
  gender?: Gender;
  kind?: KindSlug;
  colors?: ColorSlug[];
  /** Só para roupas: treino, corrida, casual... */
  style?: StyleSlug;
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

/** Um tamanho do produto na loja: com oferta à venda (e o menor preço dele) ou esgotado. */
export interface ProductSize {
  label: string;
  available: boolean;
  /** Menor preço à venda neste tamanho (pode ser diferente do preço do card). */
  price?: number;
  /** Medida informada pela loja, ex.: "Comprimento do pé: 25 cm". */
  note?: string;
}

/**
 * Detalhes para a página do produto, em src/data/details.json (separado para não pesar os cards).
 * O bot de promoções preenche aos poucos; produto sem detalhes mostra só a foto principal.
 */
export interface ProductDetails {
  images?: string[];
  /** Nome do seletor na loja ("Tamanho", "Numeração"...). */
  sizeLabel?: string;
  sizes?: ProductSize[];
  /** ISO 8601. Quando o bot conferiu fotos e tamanhos na loja. */
  checkedAt: string;
}
