// WhatsApp Cloud API (oficial da Meta). DESLIGADO por padrão: só roda com WHATSAPP_ENABLED=true.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates
//
// Regras importantes (leia o README):
// - Só mande para quem pediu para receber (opt-in). Senão a Meta bloqueia o número.
// - Mensagem iniciada pela empresa precisa ser um "modelo" (template) aprovado, e cada uma é cobrada.
// - Não existe API oficial para postar em Canais do WhatsApp; nada de bibliotecas não oficiais.

import { GRAPH_API, canais } from "../config.mjs";
import { parametrosWhatsApp } from "../texto.mjs";

export async function publicarWhatsApp(p, { agora }) {
  const wa = canais.whatsapp;
  const parametros = parametrosWhatsApp(p, agora).map((text) => ({ type: "text", text }));
  const enviados = [];
  const erros = [];

  for (const numero of wa.destinatarios) {
    const resp = await fetch(`${GRAPH_API}/${wa.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${wa.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numero,
        type: "template",
        template: {
          name: wa.template,
          language: { code: wa.idioma },
          components: [{ type: "body", parameters: parametros }],
        },
      }),
    });
    const json = await resp.json().catch(() => ({}));
    if (resp.ok) enviados.push(numero);
    else erros.push(`${numero}: ${json.error?.message ?? resp.status}`);
  }

  if (!enviados.length) throw new Error(`WhatsApp: ${erros.join("; ")}`);
  if (erros.length) console.warn(`   WhatsApp falhou para: ${erros.join("; ")}`);
  return `${enviados.length} mensagem(ns)`;
}
