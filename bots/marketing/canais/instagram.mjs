// Instagram Graph API (conta Business ou Creator ligada a uma Página do Facebook).
// Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing
//
// O Instagram NÃO aceita upload direto: ele baixa a imagem de um link público.
// Então: 1) subimos o card para o próprio repositório no GitHub (repositório público),
//        2) passamos o link "raw" para o Instagram, 3) publicamos e 4) apagamos o arquivo.

import { GRAPH_API, canais } from "../config.mjs";
import { textoInstagram } from "../texto.mjs";

export async function publicarInstagram(p, { card, agora }) {
  const ig = canais.instagram;
  if (!card) throw new Error("Instagram precisa do card em imagem (o pacote sharp não carregou).");
  if (!ig.githubRepo || !ig.githubToken) {
    throw new Error("Instagram precisa de GITHUB_REPOSITORY e GITHUB_TOKEN para hospedar a imagem (rode pelo GitHub Actions).");
  }

  const caminho = `bots/marketing/cards/${p.id}-${Date.now()}.png`;
  const arquivo = await subirNoGitHub(caminho, card);
  try {
    const imageUrl = `https://raw.githubusercontent.com/${ig.githubRepo}/${ig.githubBranch}/${caminho}`;

    const container = await graph(`${ig.userId}/media`, { image_url: imageUrl, caption: textoInstagram(p, agora) });

    // Espera o Instagram terminar de baixar/processar a imagem (normalmente poucos segundos).
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      const status = await graph(`${container.id}?fields=status_code`, null, "GET");
      if (status.status_code === "FINISHED") break;
      if (status.status_code === "ERROR") throw new Error("Instagram não conseguiu processar a imagem.");
      await new Promise((r) => setTimeout(r, 3000));
    }

    const post = await graph(`${ig.userId}/media_publish`, { creation_id: container.id });
    return `post ${post.id}`;
  } finally {
    await apagarDoGitHub(caminho, arquivo.sha).catch((e) => console.warn(`   (não apaguei ${caminho}: ${e.message})`));
  }
}

async function graph(caminho, params, metodo = "POST") {
  const url = new URL(`${GRAPH_API}/${caminho}`);
  url.searchParams.set("access_token", canais.instagram.token);
  const resp = await fetch(url, {
    method: metodo,
    body: params ? new URLSearchParams(params) : undefined,
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok || json.error) throw new Error(`Instagram: ${json.error?.message ?? `HTTP ${resp.status}`}`);
  return json;
}

async function github(caminho, metodo, corpo) {
  const { githubRepo, githubToken } = canais.instagram;
  const resp = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${caminho}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`GitHub: ${json.message ?? resp.status}`);
  return json;
}

async function subirNoGitHub(caminho, png) {
  const json = await github(caminho, "PUT", {
    message: "bot de marketing: card temporário do Instagram [skip ci]",
    content: png.toString("base64"),
    branch: canais.instagram.githubBranch,
  });
  return json.content;
}

function apagarDoGitHub(caminho, sha) {
  return github(caminho, "DELETE", {
    message: "bot de marketing: remove card temporário [skip ci]",
    sha,
    branch: canais.instagram.githubBranch,
  });
}
