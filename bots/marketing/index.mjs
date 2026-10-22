// Bot de marketing do SIMPLE ATHLETIC.
//
//   npm run bot:marketing -- --dry-run          mostra os próximos posts, não publica nada
//   npm run bot:marketing -- --dry-run --quantidade=3
//   npm run bot:marketing                        publica de verdade (canais com chaves configuradas)
//   npm run bot:marketing -- --canal=telegram    só um canal
//   npm run bot:marketing -- --forcar            ignora horário e limites (use para testar)

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PREVIEW_DIR, canais, config } from "./config.mjs";
import { carregarHistorico, carregarOfertas, escolherOfertas, podePostar, relogioBrasilia, salvarHistorico } from "./ofertas.mjs";
import { parametrosWhatsApp, textoInstagram, textoTelegram, textoX } from "./texto.mjs";
import { gerarCard } from "./card.mjs";
import { publicarTelegram } from "./canais/telegram.mjs";
import { publicarX } from "./canais/x.mjs";
import { publicarInstagram } from "./canais/instagram.mjs";
import { publicarWhatsApp } from "./canais/whatsapp.mjs";

const PUBLICAR = { telegram: publicarTelegram, x: publicarX, instagram: publicarInstagram, whatsapp: publicarWhatsApp };
const PREVIA = {
  telegram: textoTelegram,
  x: textoX,
  instagram: textoInstagram,
  whatsapp: (p, agora) => parametrosWhatsApp(p, agora).map((v, i) => `{{${i + 1}}} = ${v}`).join("\n"),
};
const PRECISA_CARD = new Set(["telegram", "instagram"]);

const args = process.argv.slice(2);
const flag = (...nomes) => args.some((a) => nomes.includes(a));
const opcao = (nome) => args.find((a) => a.startsWith(`--${nome}=`))?.split("=")[1];

const dryRun = flag("--dry-run", "--teste");
const forcar = flag("--forcar", "--force");
const soCanal = opcao("canal") ?? opcao("channel");
const quantidade = Math.max(1, Number(opcao("quantidade") ?? 1) || 1);

async function main() {
  const agora = Date.now();
  const ofertas = await carregarOfertas();
  const historico = await carregarHistorico();
  const { dia, hora } = relogioBrasilia(agora);

  console.log(`\n🏃 Bot de marketing SIMPLE ATHLETIC — ${dia} ${hora}h (Brasília)${dryRun ? "  [DRY-RUN: nada será publicado]" : ""}`);
  console.log(`   ${ofertas.length} ofertas no products.json · ${historico.posts.length} posts no histórico`);
  if (!config.siteUrl) {
    if (!dryRun) throw new Error("Defina a variável SITE_URL (ex.: https://seudominio.com.br) antes de publicar.");
    console.log("   ⚠️  SITE_URL não definida: os links aparecem como https://SEU_DOMINIO");
  }

  const cardsGerados = new Map();
  const cardDe = async (p) => {
    if (!cardsGerados.has(p.id)) {
      cardsGerados.set(
        p.id,
        await gerarCard(p, agora).catch((erro) => {
          console.warn(`   ⚠️  Não consegui gerar o card de ${p.id}: ${erro.message}`);
          return null;
        }),
      );
    }
    return cardsGerados.get(p.id);
  };

  let falhas = 0;
  let publicados = 0;

  for (const [id, canal] of Object.entries(canais)) {
    if (soCanal && soCanal !== id) continue;
    console.log(`\n━━━━━━━━━━ ${canal.nome} ━━━━━━━━━━`);

    if (!canal.ativo) {
      console.log(`   desligado (falta: ${canal.faltando.join(", ")})`);
      if (!dryRun) continue;
    }

    const regra = podePostar(id, canal.maxPorDia, historico, agora);
    if (!regra.ok && !forcar) {
      console.log(`   ⏸️  agora não: ${regra.motivo}`);
      if (!dryRun) continue;
      console.log("   (no dry-run mostro mesmo assim como ficaria o próximo post)");
    } else {
      console.log(`   ✅ pode postar (${forcar ? "--forcar" : regra.motivo})`);
    }

    const fila = escolherOfertas(ofertas, id, historico, agora);
    if (!fila.length) {
      console.log("   nenhuma oferta nova para este canal.");
      continue;
    }

    if (dryRun) {
      for (const p of fila.slice(0, quantidade)) {
        console.log(`\n   ▶ ${p.id}\n`);
        console.log(indentar(PREVIA[id](p, agora)));
        if (PRECISA_CARD.has(id)) {
          const card = await cardDe(p);
          if (card) {
            await mkdir(PREVIEW_DIR, { recursive: true });
            const arquivo = path.join(PREVIEW_DIR, `${p.id}.png`);
            await writeFile(arquivo, card);
            console.log(`\n   🖼️  card salvo em ${path.relative(process.cwd(), arquivo)}`);
          }
        }
      }
      continue;
    }

    const p = fila[0];
    try {
      const card = PRECISA_CARD.has(id) ? await cardDe(p) : null;
      const resultado = await PUBLICAR[id](p, { card, agora });
      historico.posts.push({ id: p.id, canal: id, em: new Date(agora).toISOString(), preco: p.price });
      publicados++;
      console.log(`   🚀 publicado ${p.id} (${resultado})`);
    } catch (erro) {
      falhas++;
      console.error(`   ❌ erro ao publicar ${p.id}: ${erro.message}`);
    }
  }

  if (!dryRun) {
    await salvarHistorico(historico, agora);
    console.log(`\nResumo: ${publicados} publicado(s), ${falhas} erro(s). Histórico salvo em bots/marketing/postados.json`);
    if (falhas) process.exitCode = 1;
  } else {
    console.log("\nDry-run concluído. Nada foi publicado e o histórico não mudou.");
  }
}

const indentar = (texto) =>
  texto
    .split("\n")
    .map((l) => `   │ ${l}`)
    .join("\n");

main().catch((erro) => {
  console.error(`\n❌ ${erro.message}`);
  process.exit(1);
});
