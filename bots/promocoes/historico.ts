import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Histórico de preços observado pelo próprio bot (memória persistente em dados/historico.json).
 * É o que permite dizer se um desconto é real ou se o "preço de" foi inflado antes da promoção.
 */
interface Ponto {
  /** Data ISO da observação. */
  t: string;
  /** Preço visto. */
  p: number;
  /** Preço "de" anunciado pela loja naquele momento. */
  r?: number;
}

interface Registro {
  /** Última vez que o produto apareceu numa busca ou rechecagem. */
  visto: string;
  pontos: Ponto[];
}

export interface AnalisePreco {
  amostras: number;
  /** Quantos dias o histórico cobre. */
  dias: number;
  minimo?: number;
  maximo?: number;
  mediana?: number;
  /** Desconto do preço atual sobre a mediana observada (0..1). Só existe com histórico suficiente. */
  descontoReal?: number;
  /** O "preço de" anunciado está bem acima do que já foi praticado, ou o preço subiu antes da "promoção". */
  inflado: boolean;
  motivoInflado?: string;
}

const DIA = 24 * 60 * 60 * 1000;
/** Só grava um novo ponto se o preço mudou ou se o último ponto tem mais que isso. */
const INTERVALO_MINIMO = 12 * 60 * 60 * 1000;
const JANELA = 30 * DIA;
const GUARDAR_POR = 90 * DIA;
const ESQUECER_APOS = 60 * DIA;
/** Histórico mínimo para chamar um desconto de verificado. */
const MIN_AMOSTRAS = 3;
const MIN_DIAS = 3;

export class Historico {
  private dados: Record<string, Registro>;

  constructor(private arquivo: string) {
    this.dados = existsSync(arquivo) ? (JSON.parse(readFileSync(arquivo, "utf8")) as Record<string, Registro>) : {};
  }

  registrar(id: string, preco: number, referencia: number | undefined, agora: number) {
    const reg = (this.dados[id] ??= { visto: "", pontos: [] });
    reg.visto = new Date(agora).toISOString();
    const ultimo = reg.pontos.at(-1);
    if (ultimo && ultimo.p === preco && ultimo.r === referencia && agora - Date.parse(ultimo.t) < INTERVALO_MINIMO) return;
    reg.pontos.push({ t: reg.visto, p: preco, ...(referencia ? { r: referencia } : {}) });
  }

  analisar(id: string, precoAtual: number, referencia: number | undefined, agora: number): AnalisePreco {
    const pontos = (this.dados[id]?.pontos ?? []).filter((p) => agora - Date.parse(p.t) <= JANELA);
    const precos = pontos.map((p) => p.p).sort((a, b) => a - b);
    const dias = pontos.length ? (agora - Date.parse(pontos[0].t)) / DIA : 0;
    const base: AnalisePreco = { amostras: pontos.length, dias: Math.round(dias * 10) / 10, inflado: false };
    if (!precos.length) return base;

    const mediana = precos[Math.floor(precos.length / 2)];
    const analise: AnalisePreco = { ...base, minimo: precos[0], maximo: precos.at(-1), mediana };
    const suficiente = pontos.length >= MIN_AMOSTRAS && dias >= MIN_DIAS;
    if (!suficiente) return analise;

    analise.descontoReal = Math.max(0, (mediana - precoAtual) / mediana);
    if (referencia && analise.maximo && referencia > analise.maximo * 1.1) {
      analise.inflado = true;
      analise.motivoInflado = `preço "de" (R$ ${referencia}) acima de tudo que foi praticado em 30 dias (máx. R$ ${analise.maximo})`;
    } else if (referencia && precoAtual >= precos[0] * 0.98 && referencia > mediana * 1.15) {
      analise.inflado = true;
      analise.motivoInflado = `preço atual igual ao mínimo de 30 dias (R$ ${precos[0]}); o desconto vem só de um "preço de" alto`;
    }
    return analise;
  }

  /** Apaga pontos velhos e produtos que sumiram há muito tempo. */
  limpar(agora: number) {
    for (const [id, reg] of Object.entries(this.dados)) {
      if (agora - Date.parse(reg.visto) > ESQUECER_APOS) {
        delete this.dados[id];
        continue;
      }
      reg.pontos = reg.pontos.filter((p) => agora - Date.parse(p.t) <= GUARDAR_POR);
    }
  }

  get tamanho() {
    return Object.keys(this.dados).length;
  }

  salvar() {
    mkdirSync(dirname(this.arquivo), { recursive: true });
    writeFileSync(this.arquivo, JSON.stringify(this.dados) + "\n");
  }
}
