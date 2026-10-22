// X (Twitter) API v2: cria um post de texto com o link do site.
// Docs: https://docs.x.com/x-api/posts/create-post
// A API exige assinatura OAuth 1.0a com as 4 chaves do app (feita abaixo, sem bibliotecas).

import crypto from "node:crypto";
import { canais } from "../config.mjs";
import { textoX } from "../texto.mjs";

const URL_POSTS = "https://api.x.com/2/tweets";

export async function publicarX(p, { agora }) {
  const resp = await fetch(URL_POSTS, {
    method: "POST",
    headers: { Authorization: assinaturaOAuth("POST", URL_POSTS), "Content-Type": "application/json" },
    body: JSON.stringify({ text: textoX(p, agora) }),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`X: HTTP ${resp.status} ${JSON.stringify(json.detail ?? json.title ?? json)}`);
  return `post ${json.data?.id}`;
}

function assinaturaOAuth(metodo, url) {
  const { apiKey, apiSecret, accessToken, accessSecret } = canais.x;
  const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  const params = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };
  // Corpo JSON não entra na assinatura; só os parâmetros oauth_*.
  const base = [
    metodo,
    enc(url),
    enc(
      Object.keys(params)
        .sort()
        .map((k) => `${enc(k)}=${enc(params[k])}`)
        .join("&"),
    ),
  ].join("&");
  const assinatura = crypto.createHmac("sha1", `${enc(apiSecret)}&${enc(accessSecret)}`).update(base).digest("base64");
  return (
    "OAuth " +
    Object.entries({ ...params, oauth_signature: assinatura })
      .map(([k, v]) => `${enc(k)}="${enc(v)}"`)
      .join(", ")
  );
}
