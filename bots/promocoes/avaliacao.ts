import type { AnalisePreco } from "./historico";
import { descontoPercentual, type Oferta } from "./tipos";

/**
 * Nota de 0 a 100 de cada oportunidade (seção 7 do documento do agente).
 * Critério sem informação fica de fora da conta e reduz a confiança: nada de nota inventada.
 * Os pesos são o ponto de partida; ajuste quando houver dados de cliques e vendas.
 */
export const PESOS = {
  preco: 25,
  demanda: 20,
  qualidade: 20,
  conversao: 15,
  retorno: 10,
  disponibilidade: 10,
} as const;

/**
 * Confiança mínima para publicar. Calibrada para o que o ML libera hoje (preço, preço "de", vendedor;
 * sem avaliações nem estoque): uma oferta nova chega a ~0,3–0,4 e sobe com o histórico de preço.
 */
export const CONFIANCA_MINIMA = { alta: 0.4, media: 0.3 } as const;

export type Criterio = keyof typeof PESOS;
export type Prioridade = "alta" | "media" | "baixa" | "rejeitada";

export interface Avaliacao {
  /** 0 a 100, ou null quando quase nada é conhecido. */
  nota: number | null;
  /** 0 a 1: quanto dos pesos teve dado real por trás. */
  confianca: number;
  prioridade: Prioridade;
  /** Desconto confirmado pelo histórico do próprio bot (true) ou só o anunciado pela loja (false). */
  descontoVerificado: boolean;
  criterios: Record<Criterio, number | null>;
  motivos: string[];
}

const limitar = (v: number) => Math.max(0, Math.min(1, v));

export function avaliar(o: Oferta, preco: AnalisePreco): Avaliacao {
  const s = o.sinais ?? {};
  const motivos: string[] = [];
  const anunciado = descontoPercentual(o.price, o.oldPrice) / 100;
  const verificado = preco.descontoReal !== undefined;

  // --- Critérios (0..1) e quanto confiamos em cada um (0..1) ---
  const valor: Record<Criterio, number | null> = { preco: null, demanda: null, qualidade: null, conversao: null, retorno: null, disponibilidade: null };
  const conf: Record<Criterio, number> = { preco: 0, demanda: 0, qualidade: 0, conversao: 0, retorno: 0, disponibilidade: 0 };

  // Preço: desconto real sobre o histórico vale mais que o "preço de" anunciado.
  if (verificado) {
    valor.preco = limitar((preco.descontoReal! - 0.05) / 0.35);
    conf.preco = 1;
  } else if (anunciado > 0) {
    valor.preco = limitar((anunciado - 0.05) / 0.35);
    conf.preco = 0.5;
    motivos.push(`desconto de ${Math.round(anunciado * 100)}% é o anunciado pela loja; histórico ainda insuficiente (${preco.amostras} obs. em ${preco.dias} dias)`);
  }

  // Demanda: sem dado de procura, usamos volume de avaliações/vendas como sinal indireto.
  const volume = Math.max(o.reviews ?? 0, s.vendidos ?? 0);
  if (volume > 0) {
    valor.demanda = limitar(Math.log10(volume + 1) / 3);
    conf.demanda = 0.6;
  }

  // Qualidade e confiabilidade: reputação do vendedor, loja oficial e nota dos compradores.
  const partes: number[] = [];
  if (s.lojaOficial) partes.push(1);
  if (s.nivelVendedor) partes.push([0, 0, 0.2, 0.5, 0.8, 1][s.nivelVendedor]);
  if (o.rating && (o.reviews ?? 0) >= 5) partes.push(o.rating >= 4.7 ? 1 : o.rating >= 4.5 ? 0.85 : o.rating >= 4.2 ? 0.65 : o.rating >= 4 ? 0.5 : 0.2);
  if (partes.length) {
    valor.qualidade = partes.reduce((a, b) => a + b, 0) / partes.length;
    conf.qualidade = Math.min(1, partes.length / 2);
  }

  // Conversão: fatores observáveis que costumam ajudar no clique e na compra.
  valor.conversao = limitar(0.45 + (o.freeShipping ? 0.25 : 0) + (o.price <= 300 ? 0.15 : 0) + ((o.rating ?? 0) >= 4.5 ? 0.15 : 0));
  conf.conversao = 0.6;

  // Retorno: a comissão por item não vem da API; fica desconhecido em vez de estimado.

  // Disponibilidade.
  if (s.estoque !== undefined) {
    valor.disponibilidade = s.estoque >= 10 ? 1 : s.estoque >= 3 ? 0.6 : s.estoque > 0 ? 0.3 : 0;
    conf.disponibilidade = 1;
  }

  let soma = 0;
  let pesoUsado = 0;
  for (const c of Object.keys(PESOS) as Criterio[]) {
    if (valor[c] === null) continue;
    const peso = PESOS[c] * conf[c];
    soma += valor[c]! * peso;
    pesoUsado += peso;
  }
  const pesoTotal = Object.values(PESOS).reduce((a, b) => a + b, 0);
  const confianca = Math.round((pesoUsado / pesoTotal) * 100) / 100;
  const nota = pesoUsado >= pesoTotal * 0.25 ? Math.round((soma / pesoUsado) * 100) : null;

  // --- Critérios eliminatórios: nenhuma nota compensa ---
  const rejeicoes: string[] = [];
  if (preco.inflado) rejeicoes.push(`desconto suspeito: ${preco.motivoInflado}`);
  if (s.condicao && s.condicao !== "new") rejeicoes.push(`produto ${s.condicao === "used" ? "usado" : s.condicao}`);
  if (s.nivelVendedor !== undefined && s.nivelVendedor <= 2) rejeicoes.push(`reputação do vendedor baixa (nível ${s.nivelVendedor} de 5)`);
  if (o.rating !== undefined && o.rating < 3.8 && (o.reviews ?? 0) >= 10) rejeicoes.push(`nota dos compradores baixa (${o.rating} em ${o.reviews} avaliações)`);
  if (s.estoque === 0) rejeicoes.push("sem estoque");

  let prioridade: Prioridade;
  if (rejeicoes.length) prioridade = "rejeitada";
  else if (nota === null) {
    prioridade = "baixa";
    motivos.push("informações insuficientes para avaliar");
  } else if (nota >= 70 && confianca >= CONFIANCA_MINIMA.alta) prioridade = "alta";
  else if (nota >= 55 && confianca >= CONFIANCA_MINIMA.media) prioridade = "media";
  else prioridade = "baixa";

  if (s.nivelVendedor === undefined && !s.lojaOficial) motivos.push("reputação do vendedor indisponível");
  return { nota, confianca, prioridade, descontoVerificado: verificado, criterios: valor, motivos: [...rejeicoes, ...motivos] };
}
