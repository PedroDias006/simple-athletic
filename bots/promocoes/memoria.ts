import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Avaliacao } from "./avaliacao";

/**
 * Memória operacional (seção 18): toda decisão fica registrada com data, motivo e confiança,
 * e cada execução gera um relatório legível em dados/relatorio.md.
 */
export type Acao = "publicada" | "rejeitada" | "observacao" | "retirada" | "atualizada";

export interface Decisao {
  t: string;
  id: string;
  titulo: string;
  acao: Acao;
  preco?: number;
  precoDe?: number;
  nota?: number | null;
  confianca?: number;
  descontoVerificado?: boolean;
  motivos: string[];
}

const MAX_LINHAS = 5000;

export class Memoria {
  readonly decisoes: Decisao[] = [];
  readonly avisos: string[] = [];

  constructor(private pasta: string, private agora: number) {}

  registrar(id: string, titulo: string, acao: Acao, extra: Partial<Decisao> & { avaliacao?: Avaliacao } = {}) {
    const { avaliacao, ...resto } = extra;
    this.decisoes.push({
      t: new Date(this.agora).toISOString(),
      id,
      titulo: titulo.slice(0, 90),
      acao,
      ...(avaliacao ? { nota: avaliacao.nota, confianca: avaliacao.confianca, descontoVerificado: avaliacao.descontoVerificado, motivos: avaliacao.motivos } : { motivos: [] }),
      ...resto,
    });
  }

  aviso(msg: string) {
    this.avisos.push(msg);
  }

  /** Acrescenta as decisões desta execução em decisoes.jsonl (mantendo as últimas MAX_LINHAS). */
  salvarDecisoes() {
    const arquivo = `${this.pasta}/decisoes.jsonl`;
    mkdirSync(dirname(arquivo), { recursive: true });
    const antigas = existsSync(arquivo) ? readFileSync(arquivo, "utf8").split("\n").filter(Boolean) : [];
    const todas = [...antigas, ...this.decisoes.map((d) => JSON.stringify(d))].slice(-MAX_LINHAS);
    writeFileSync(arquivo, todas.join("\n") + "\n");
  }

  salvarRelatorio(resumo: { lojas: string[]; ativas: number; historico: number; limitacoes: string[] }) {
    const por = (a: Decisao["acao"]) => this.decisoes.filter((d) => d.acao === a);
    const publicadas = por("publicada").sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0));
    const rejeitadas = por("rejeitada");
    const motivosRejeicao = new Map<string, number>();
    for (const d of rejeitadas) {
      const m = (d.motivos[0] ?? "sem motivo").split(":")[0].replace(/\(.*\)/g, "").trim();
      motivosRejeicao.set(m, (motivosRejeicao.get(m) ?? 0) + 1);
    }
    const fmt = (v?: number) => (v === undefined ? "?" : `R$ ${v.toFixed(2).replace(".", ",")}`);

    const linhas = [
      `# Relatório do bot de promoções`,
      ``,
      `Execução: ${new Date(this.agora).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (horário de Brasília)`,
      ``,
      `**Medido nesta execução:** ${resumo.ativas} ofertas ativas no site · ${publicadas.length} novas publicadas · ${por("retirada").length} retiradas · ${rejeitadas.length} rejeitadas · ${por("observacao").length} em observação · ${resumo.historico} produtos com histórico de preço.`,
      ``,
      `Lojas ligadas: ${resumo.lojas.length ? resumo.lojas.join(", ") : "nenhuma"}.`,
      ``,
      `## Publicadas agora`,
      ``,
      publicadas.length
        ? [`| Nota | Confiança | Desconto | Produto | Preço |`, `| --- | --- | --- | --- | --- |`, ...publicadas.slice(0, 30).map((d) => `| ${d.nota ?? "?"} | ${Math.round((d.confianca ?? 0) * 100)}% | ${d.descontoVerificado ? "verificado" : "anunciado"} | ${d.titulo.replace(/\|/g, "/")} | ${fmt(d.preco)} (de ${fmt(d.precoDe)}) |`)].join("\n")
        : "Nenhuma.",
      ``,
      `## Retiradas do site`,
      ``,
      por("retirada").length ? por("retirada").map((d) => `- ${d.titulo}: ${d.motivos.join("; ")}`).join("\n") : "Nenhuma.",
      ``,
      `## Rejeitadas (por motivo principal)`,
      ``,
      motivosRejeicao.size ? [...motivosRejeicao].sort((a, b) => b[1] - a[1]).map(([m, n]) => `- ${n}× ${m}`).join("\n") : "Nenhuma.",
      ``,
      `## Avisos`,
      ``,
      this.avisos.length ? this.avisos.map((a) => `- ${a}`).join("\n") : "Nenhum.",
      ``,
      `## Limitações conhecidas`,
      ``,
      ...resumo.limitacoes.map((l) => `- ${l}`),
      ``,
      `Detalhe de cada decisão: \`bots/promocoes/dados/decisoes.jsonl\`.`,
      ``,
    ];
    writeFileSync(`${this.pasta}/relatorio.md`, linhas.join("\n"));
  }
}
