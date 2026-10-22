// Telegram Bot API: manda foto + legenda + botão "Ver oferta" para o canal.
// Docs: https://core.telegram.org/bots/api#sendphoto

import { canais } from "../config.mjs";
import { linkDaOferta, textoTelegram } from "../texto.mjs";

export async function publicarTelegram(p, { card, agora }) {
  const { token, chatId } = canais.telegram;
  const legenda = textoTelegram(p, agora);
  const botao = JSON.stringify({ inline_keyboard: [[{ text: "🛒 Ver oferta", url: linkDaOferta(p) }]] });

  if (card) {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("caption", legenda);
    form.append("parse_mode", "HTML");
    form.append("reply_markup", botao);
    form.append("photo", new Blob([card], { type: "image/png" }), `${p.id}.png`);
    return chamar(token, "sendPhoto", form);
  }

  // Sem card (ex.: sharp não instalado): manda só o texto com a prévia do link.
  return chamar(
    token,
    "sendMessage",
    JSON.stringify({ chat_id: chatId, text: legenda, parse_mode: "HTML", reply_markup: JSON.parse(botao) }),
  );
}

async function chamar(token, metodo, corpo) {
  const resp = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
    method: "POST",
    body: corpo,
    headers: typeof corpo === "string" ? { "Content-Type": "application/json" } : undefined,
  });
  const json = await resp.json().catch(() => ({}));
  if (!json.ok) throw new Error(`Telegram ${metodo}: ${json.description ?? resp.status}`);
  return `mensagem ${json.result.message_id}`;
}
