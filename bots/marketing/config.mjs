// Configuração do bot de marketing. Tudo vem de variáveis de ambiente
// (GitHub Secrets no Actions, ou o arquivo bots/marketing/.env no seu PC).

import path from "node:path";
import { fileURLToPath } from "node:url";

export const BOT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(BOT_DIR, "..", "..");
export const PRODUCTS_FILE = path.join(ROOT_DIR, "src", "data", "products.json");
export const HISTORY_FILE = path.join(BOT_DIR, "postados.json");
export const PREVIEW_DIR = path.join(BOT_DIR, ".preview");
export const PUBLIC_DIR = path.join(ROOT_DIR, "public");

export const TIMEZONE = "America/Sao_Paulo";

const env = (name, fallback = "") => (process.env[name] ?? "").trim() || fallback;
const num = (name, fallback) => {
  const value = Number(env(name));
  return Number.isFinite(value) && env(name) !== "" ? value : fallback;
};

export const config = {
  /** Endereço público do site, sem barra no final. Ex.: https://simpleathletic.com.br */
  siteUrl: env("SITE_URL").replace(/\/+$/, ""),

  /** Só posta entre HORA_INICIO e HORA_FIM (horário de Brasília). 8 e 22 = das 8:00 às 21:59. */
  horaInicio: num("HORA_INICIO", 8),
  horaFim: num("HORA_FIM", 22),

  /** Intervalo mínimo entre dois posts no MESMO canal. 55 em vez de 60 porque o cron do GitHub atrasa alguns minutos. */
  intervaloMinutos: num("INTERVALO_MINUTOS", 55),

  /** Máximo de posts por canal por dia. */
  maxPorDia: num("MAX_POSTS_DIA", 8),

  /** Desconto mínimo (%) para uma oferta ser divulgada. */
  descontoMinimo: num("DESCONTO_MINIMO", 10),

  /** Depois de quantos dias a mesma oferta pode voltar a ser postada no mesmo canal. */
  repostarAposDias: num("REPOSTAR_APOS_DIAS", 7),

  hashtags: env("HASHTAGS", "#SimpleAthletic #promoção #ofertas"),
};

/**
 * Cada canal só liga se as chaves dele existirem.
 * `maxPorDia` pode ser diferente por canal (WhatsApp cobra por mensagem, então começa baixo).
 */
export const canais = {
  telegram: {
    nome: "Telegram",
    ativo: Boolean(env("TELEGRAM_BOT_TOKEN") && env("TELEGRAM_CHAT_ID")),
    faltando: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"].filter((k) => !env(k)),
    maxPorDia: num("TELEGRAM_MAX_POR_DIA", config.maxPorDia),
    token: env("TELEGRAM_BOT_TOKEN"),
    chatId: env("TELEGRAM_CHAT_ID"),
  },
  x: {
    nome: "X (Twitter)",
    ativo: Boolean(env("X_API_KEY") && env("X_API_SECRET") && env("X_ACCESS_TOKEN") && env("X_ACCESS_SECRET")),
    faltando: ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"].filter((k) => !env(k)),
    maxPorDia: num("X_MAX_POR_DIA", config.maxPorDia),
    apiKey: env("X_API_KEY"),
    apiSecret: env("X_API_SECRET"),
    accessToken: env("X_ACCESS_TOKEN"),
    accessSecret: env("X_ACCESS_SECRET"),
  },
  instagram: {
    nome: "Instagram",
    ativo: Boolean(env("INSTAGRAM_ACCESS_TOKEN") && env("INSTAGRAM_USER_ID")),
    faltando: ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_USER_ID"].filter((k) => !env(k)),
    maxPorDia: num("INSTAGRAM_MAX_POR_DIA", 3),
    token: env("INSTAGRAM_ACCESS_TOKEN"),
    userId: env("INSTAGRAM_USER_ID"),
    // Para hospedar a imagem do card (o Instagram exige um link público). No GitHub Actions
    // essas três vêm sozinhas; veja o README.
    githubRepo: env("GITHUB_REPOSITORY"),
    githubToken: env("GITHUB_TOKEN"),
    githubBranch: env("GITHUB_REF_NAME", "main"),
  },
  whatsapp: {
    nome: "WhatsApp",
    // Desligado por padrão: precisa de WHATSAPP_ENABLED=true além das chaves.
    ativo:
      env("WHATSAPP_ENABLED") === "true" &&
      Boolean(env("WHATSAPP_TOKEN") && env("WHATSAPP_PHONE_NUMBER_ID") && env("WHATSAPP_TO")),
    faltando: [
      ...(env("WHATSAPP_ENABLED") === "true" ? [] : ["WHATSAPP_ENABLED=true"]),
      ...["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_TO"].filter((k) => !env(k)),
    ],
    maxPorDia: num("WHATSAPP_MAX_POR_DIA", 1),
    token: env("WHATSAPP_TOKEN"),
    phoneNumberId: env("WHATSAPP_PHONE_NUMBER_ID"),
    destinatarios: env("WHATSAPP_TO").split(",").map((n) => n.replace(/\D/g, "")).filter(Boolean),
    template: env("WHATSAPP_TEMPLATE", "oferta_do_dia"),
    idioma: env("WHATSAPP_TEMPLATE_LANG", "pt_BR"),
  },
};

export const GRAPH_API = "https://graph.facebook.com/v23.0";
