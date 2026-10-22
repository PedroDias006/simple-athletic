// Lê as ofertas, guarda o histórico do que já foi postado e decide o que postar.

import { readFile, writeFile } from "node:fs/promises";
import { HISTORY_FILE, PRODUCTS_FILE, TIMEZONE, config } from "./config.mjs";

/** @typedef {import("../../src/types/product").Product} Product */
/** @typedef {{ id: string, canal: string, em: string, preco: number }} Post */

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

/** @returns {Promise<Product[]>} */
export async function carregarOfertas() {
  return JSON.parse(await readFile(PRODUCTS_FILE, "utf8"));
}

/** @returns {Promise<{ posts: Post[] }>} */
export async function carregarHistorico() {
  try {
    const data = JSON.parse(await readFile(HISTORY_FILE, "utf8"));
    return { posts: Array.isArray(data.posts) ? data.posts : [] };
  } catch {
    return { posts: [] };
  }
}

/** Salva o histórico, jogando fora registros com mais de 60 dias para o arquivo não crescer para sempre. */
export async function salvarHistorico(historico, agora = Date.now()) {
  const posts = historico.posts.filter((p) => agora - Date.parse(p.em) < 60 * DIA);
  await writeFile(HISTORY_FILE, JSON.stringify({ posts }, null, 2) + "\n", "utf8");
}

export function descontoDe(p) {
  if (!p.oldPrice || p.oldPrice <= p.price) return 0;
  return Math.round((1 - p.price / p.oldPrice) * 100);
}

/** Data (AAAA-MM-DD) e hora no fuso de Brasília. */
export function relogioBrasilia(agora = Date.now()) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(agora))
      .map((x) => [x.type, x.value]),
  );
  return { dia: `${partes.year}-${partes.month}-${partes.day}`, hora: Number(partes.hour) };
}

export function dentroDoHorario(agora = Date.now()) {
  const { hora } = relogioBrasilia(agora);
  return hora >= config.horaInicio && hora < config.horaFim;
}

/**
 * Pode postar agora neste canal? Devolve { ok, motivo }.
 * Regras: horário comercial, no máximo 1 post a cada INTERVALO_MINUTOS e MAX por dia.
 */
export function podePostar(canal, maxPorDia, historico, agora = Date.now()) {
  if (!dentroDoHorario(agora)) {
    return { ok: false, motivo: `fora do horário (${config.horaInicio}h–${config.horaFim}h de Brasília)` };
  }
  const doCanal = historico.posts.filter((p) => p.canal === canal);
  const ultimo = doCanal.reduce((max, p) => Math.max(max, Date.parse(p.em)), 0);
  const minutosDesde = (agora - ultimo) / 60000;
  if (minutosDesde < config.intervaloMinutos) {
    return { ok: false, motivo: `último post há ${Math.round(minutosDesde)} min (mínimo ${config.intervaloMinutos})` };
  }
  const hoje = relogioBrasilia(agora).dia;
  const postsHoje = doCanal.filter((p) => relogioBrasilia(Date.parse(p.em)).dia === hoje).length;
  if (postsHoje >= maxPorDia) {
    return { ok: false, motivo: `limite do dia atingido (${postsHoje}/${maxPorDia})` };
  }
  return { ok: true, motivo: `${postsHoje}/${maxPorDia} posts hoje` };
}

/**
 * Lista as ofertas que ainda não foram postadas neste canal, da melhor para a pior.
 * Uma oferta já postada só volta se passou REPOSTAR_APOS_DIAS ou se o preço caiu mais 3%.
 */
export function escolherOfertas(ofertas, canal, historico, agora = Date.now()) {
  const jaPostados = historico.posts.filter((p) => p.canal === canal);

  const candidatas = ofertas.filter((p) => {
    if (!p.active) return false;
    if (p.expiresAt && Date.parse(p.expiresAt) <= agora) return false;
    if (descontoDe(p) < config.descontoMinimo) return false;
    const anterior = jaPostados
      .filter((h) => h.id === p.id)
      .sort((a, b) => Date.parse(b.em) - Date.parse(a.em))[0];
    if (!anterior) return true;
    const velho = agora - Date.parse(anterior.em) > config.repostarAposDias * DIA;
    const caiuMais = p.price < anterior.preco * 0.97;
    return velho || caiuMais;
  });

  return candidatas
    .map((p) => ({ produto: p, pontos: pontuar(p, agora) }))
    .sort((a, b) => b.pontos - a.pontos)
    .map((x) => x.produto);
}

/** Nota da oferta: desconto em % + bônus para oferta nova e para oferta que está acabando. */
function pontuar(p, agora) {
  let pontos = descontoDe(p);
  if (agora - Date.parse(p.updatedAt) < DIA) pontos += 10;
  if (p.expiresAt && Date.parse(p.expiresAt) - agora < 48 * HORA) pontos += 5;
  if (p.coupon) pontos += 3;
  if (p.freeShipping) pontos += 2;
  return pontos;
}
