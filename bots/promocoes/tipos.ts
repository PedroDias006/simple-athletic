import type { CategorySlug, Product, ProductDetails } from "../../src/types/product";

/**
 * Sinais de qualidade que a loja informa. Não vão para products.json: servem só para a avaliação.
 * Campo ausente = informação indisponível (nunca chute um valor).
 */
export interface Sinais {
  /** Reputação do vendedor de 1 (vermelho) a 5 (verde). */
  nivelVendedor?: number;
  /** "platinum" | "gold" | "silver" (MercadoLíder). */
  medalhaVendedor?: string;
  lojaOficial?: boolean;
  estoque?: number;
  condicao?: string;
  vendidos?: number;
}

/** Oferta encontrada por um adaptador, já no formato do site (o bot completa updatedAt/active). */
export type Oferta = Omit<Product, "updatedAt" | "active"> & { sinais?: Sinais };

/** Resultado de rechecar uma oferta que já está no site. */
export type Verificacao =
  | { status: "ok"; price: number; oldPrice?: number; freeShipping?: boolean; affiliateUrl?: string }
  | { status: "indisponivel"; motivo: string }
  /** Falha de rede/API: o bot não mexe na oferta desta vez. */
  | { status: "erro"; motivo: string };

/** Interface comum a todas as lojas. */
export interface AdaptadorLoja {
  /** Todo id de oferta criado por este adaptador começa com isso (ex.: "mercadolivre-"). */
  prefixo: string;
  nome: string;
  /** Lê as variáveis de ambiente. Devolve null se estiver pronto, ou o motivo de estar desligado. */
  motivoDesligado(): string | null;
  buscarOfertas(categoria: CategorySlug): Promise<Oferta[]>;
  verificarOferta(id: string): Promise<Verificacao>;
  /** Busca reputação, avaliações e estoque de uma candidata (chamadas extras, só para as melhores). */
  enriquecer?(oferta: Oferta): Promise<Oferta>;
  /**
   * Fotos extras e tamanhos de uma oferta publicada, para a página do produto (src/data/details.json).
   * null = a loja não informa; erro = tenta de novo na próxima execução.
   */
  detalhar?(id: string): Promise<Omit<ProductDetails, "checkedAt"> | null>;
  /** true quando detalhar() não faz chamadas extras (os dados já vieram na busca): roda para todas, toda vez. */
  detalhesSemCusto?: boolean;
}

export const DESCONTO_MINIMO = 15;

export function descontoPercentual(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}

/** Avisos desta execução (vão para o relatório). */
export const avisosDaExecucao: string[] = [];

export function aviso(msg: string) {
  avisosDaExecucao.push(msg);
  console.warn(`⚠️  ${msg}`);
  if (process.env.GITHUB_ACTIONS) console.log(`::warning::${msg}`);
}

export async function buscarJson<T>(url: string, init?: RequestInit, tentativas = 3): Promise<T> {
  for (let i = 1; ; i++) {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
    if (res.ok) return (await res.json()) as T;
    const corpo = await res.text().catch(() => "");
    // 429/5xx costumam passar sozinhos; o resto é erro de verdade.
    if (i < tentativas && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 1000 * i * i));
      continue;
    }
    throw new ErroHttp(res.status, `${res.status} em ${url.split("?")[0]}: ${corpo.slice(0, 200)}`);
  }
}

export class ErroHttp extends Error {
  constructor(public status: number, msg: string) {
    super(msg);
  }
}
