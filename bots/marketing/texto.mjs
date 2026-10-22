// Monta o texto dos posts em português. Todo link aponta para SITE_URL/ir/<id>,
// nunca para a loja: assim o link de afiliado pode mudar sem quebrar posts antigos.

import { TIMEZONE, config } from "./config.mjs";
import { descontoDe } from "./ofertas.mjs";

const NOMES_LOJAS = {
  mercadolivre: "Mercado Livre",
  amazon: "Amazon",
  shopee: "Shopee",
  netshoes: "Netshoes",
  centauro: "Centauro",
  decathlon: "Decathlon",
  magalu: "Magalu",
};

const EMOJI_CATEGORIA = {
  futebol: "⚽",
  corrida: "🏃",
  raquetes: "🎾",
  musculacao: "🏋️",
  suplementos: "🥤",
  recuperacao: "🧊",
  casual: "👟",
};

/** Marca uma linha em branco proposital no meio do post. */
const PULA = "\n";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const preco = (valor) => brl.format(valor).replace(/ /g, " ");
export const nomeLoja = (store) => NOMES_LOJAS[store] ?? store;

export function linkDaOferta(p) {
  return `${config.siteUrl || "https://SEU_DOMINIO"}/ir/${encodeURIComponent(p.id)}`;
}

/** "acaba hoje às 23:59", "acaba amanhã às 18:00" ou "acaba em 31/12 às 23:59". */
export function acabaEm(p, agora = Date.now()) {
  if (!p.expiresAt) return "";
  const fim = new Date(p.expiresAt);
  const dia = (d) => new Intl.DateTimeFormat("pt-BR", { timeZone: TIMEZONE, day: "2-digit", month: "2-digit" }).format(d);
  const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit" }).format(fim);
  if (dia(fim) === dia(new Date(agora))) return `acaba hoje às ${hora}`;
  if (dia(fim) === dia(new Date(agora + 24 * 60 * 60 * 1000))) return `acaba amanhã às ${hora}`;
  return `acaba em ${dia(fim)} às ${hora}`;
}

/** Os pedaços do post, usados por todos os canais. */
export function dadosDoPost(p, agora = Date.now()) {
  const desconto = descontoDe(p);
  return {
    titulo: p.title,
    subtitulo: [p.brand, nomeLoja(p.store)].filter(Boolean).join(" · "),
    emoji: EMOJI_CATEGORIA[p.category] ?? "🔥",
    de: p.oldPrice && p.oldPrice > p.price ? preco(p.oldPrice) : "",
    por: preco(p.price),
    desconto,
    cupom: p.coupon ?? "",
    freteGratis: Boolean(p.freeShipping),
    acaba: acabaEm(p, agora),
    link: linkDaOferta(p),
    hashtagCategoria: `#${p.category}`,
  };
}

const escaparHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Telegram aceita HTML simples: negrito, riscado, código. Limite da legenda de foto: 1024 caracteres. */
export function textoTelegram(p, agora) {
  const d = dadosDoPost(p, agora);
  const linhas = [
    `${d.desconto >= 40 ? "🚨" : "🔥"} <b>${escaparHtml(d.titulo)}</b>`,
    escaparHtml(d.subtitulo),
    PULA,
    d.de ? `De <s>${d.de}</s>` : "",
    `💰 <b>Por ${d.por}</b>${d.desconto ? `  (−${d.desconto}%)` : ""}`,
    d.cupom ? `🎟️ Cupom: <code>${escaparHtml(d.cupom)}</code>` : "",
    d.freteGratis ? "🚚 Frete grátis" : "",
    d.acaba ? `⏰ ${capitalizar(d.acaba)}` : "",
    PULA,
    `👉 ${d.link}`,
  ];
  return juntar(linhas).slice(0, 1024);
}

/** X: até 280 caracteres. Links contam sempre como 23 e emojis como 2. */
export function textoX(p, agora) {
  const d = dadosDoPost(p, agora);
  const extras = [d.cupom ? `🎟️ Cupom ${d.cupom}` : "", d.freteGratis ? "🚚 Frete grátis" : ""].filter(Boolean).join(" · ");
  const montar = (titulo) =>
    juntar([
      `${d.emoji} ${titulo}${d.desconto ? ` com ${d.desconto}% OFF` : ""}`,
      PULA,
      d.de ? `De ${d.de} por ${d.por}` : `Por ${d.por}`,
      extras,
      d.acaba ? `⏰ ${capitalizar(d.acaba)}` : "",
      PULA,
      `👉 ${d.link}`,
      PULA,
      `${d.hashtagCategoria} ${config.hashtags}`,
    ]);
  let titulo = d.titulo;
  let texto = montar(titulo);
  while (tamanhoNoX(texto) > 280 && titulo.length > 20) {
    titulo = titulo.slice(0, -4).trimEnd() + "…";
    texto = montar(titulo);
  }
  if (tamanhoNoX(texto) > 280) texto = juntar([`${d.emoji} ${d.titulo}`, `Por ${d.por}`, `👉 ${d.link}`]);
  return texto;
}

/** Instagram não deixa link clicável na legenda, então mandamos para o link da bio. */
export function textoInstagram(p, agora) {
  const d = dadosDoPost(p, agora);
  return juntar([
    `${d.emoji} ${d.titulo}`,
    d.subtitulo,
    PULA,
    d.de ? `De ${d.de} por ${d.por}${d.desconto ? ` (−${d.desconto}%)` : ""}` : `Por ${d.por}`,
    d.cupom ? `🎟️ Cupom: ${d.cupom}` : "",
    d.freteGratis ? "🚚 Frete grátis" : "",
    d.acaba ? `⏰ ${capitalizar(d.acaba)}` : "",
    PULA,
    "🔗 Link na bio! Ou digite no navegador:",
    d.link.replace(/^https?:\/\//, ""),
    PULA,
    "Preços podem mudar a qualquer momento. Como afiliados, podemos ganhar comissão sem custo extra para você.",
    PULA,
    `${d.hashtagCategoria} ${config.hashtags} #esporte #treino`,
  ]);
}

/**
 * WhatsApp fora da janela de 24h só aceita "modelos" (templates) aprovados pela Meta.
 * O modelo que o README manda criar tem 3 variáveis no corpo: {{1}} título, {{2}} preço, {{3}} link.
 */
export function parametrosWhatsApp(p, agora) {
  const d = dadosDoPost(p, agora);
  const precoLinha = [
    (d.de ? `de ${d.de} por ${d.por}` : `por ${d.por}`) + (d.desconto ? ` (−${d.desconto}%)` : ""),
    d.cupom ? `cupom ${d.cupom}` : "",
    d.freteGratis ? "frete grátis" : "",
    d.acaba,
  ]
    .filter(Boolean)
    .join(", ");
  return [d.titulo, precoLinha, d.link];
}

function capitalizar(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Junta as linhas do post: some com as vazias (campo que a oferta não tem) e mantém uma só linha em branco onde houver PULA. */
function juntar(linhas) {
  return linhas
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function tamanhoNoX(texto) {
  const semLinks = texto.replace(/https?:\/\/\S+/g, "x".repeat(23));
  let total = 0;
  for (const ch of semLinks) total += ch.codePointAt(0) > 0x10ff ? 2 : 1;
  return total;
}
