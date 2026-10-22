// Gera a imagem 1080x1080 da oferta (usada no Instagram e como foto no Telegram).
// Desenhamos um SVG e o "sharp" transforma em PNG, junto com a foto do produto.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PUBLIC_DIR, config } from "./config.mjs";
import { dadosDoPost } from "./texto.mjs";

const TAM = 1080;
const CORES = { fundo: "#0b0d10", volt: "#d7ff3a", oferta: "#00a650", quente: "#ff4d2e", branco: "#ffffff", cinza: "#9aa1ab" };
const FONTE = "DejaVu Sans, Segoe UI, Arial, Helvetica, sans-serif";

/** @returns {Promise<Buffer>} PNG 1080x1080 */
export async function gerarCard(p, agora = Date.now()) {
  const sharp = (await import("sharp")).default;
  const d = dadosDoPost(p, agora);

  // Área branca onde entra a foto do produto.
  const foto = { x: 90, y: 150, w: 900, h: 470 };
  let fotoPng = null;
  try {
    const original = await carregarImagem(p.imageUrl);
    fotoPng = await sharp(original, { density: 300 })
      .resize(foto.w - 80, foto.h - 60, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
  } catch (erro) {
    console.warn(`   (sem foto do produto no card: ${erro.message})`);
  }

  const linhasTitulo = quebrarTexto(d.titulo, 30, 2);
  const chips = [d.cupom && `CUPOM ${d.cupom}`, d.freteGratis && "FRETE GRÁTIS", d.acaba && d.acaba.toUpperCase()].filter(Boolean);
  const dominio = (config.siteUrl || "SEU_DOMINIO").replace(/^https?:\/\//, "");

  let chipX = 90;
  const chipsSvg = chips
    .map((texto) => {
      const largura = Math.round(texto.length * 15.5 + 44);
      const svg = `<rect x="${chipX}" y="930" rx="26" width="${largura}" height="52" fill="none" stroke="${CORES.volt}" stroke-width="3"/>
        <text x="${chipX + largura / 2}" y="965" font-size="26" font-weight="700" fill="${CORES.volt}" text-anchor="middle">${esc(texto)}</text>`;
      chipX += largura + 16;
      return chipX > TAM - 60 ? "" : svg;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TAM}" height="${TAM}" font-family="${FONTE}">
    <rect width="100%" height="100%" fill="${CORES.fundo}"/>
    <rect x="0" y="0" width="${TAM}" height="12" fill="${CORES.volt}"/>
    <text x="90" y="100" font-size="38" font-weight="800" fill="${CORES.branco}" letter-spacing="4">SIMPLE <tspan fill="${CORES.volt}">ATHLETIC</tspan></text>
    <text x="990" y="100" font-size="28" fill="${CORES.cinza}" text-anchor="end">${esc(d.subtitulo)}</text>
    <rect x="${foto.x}" y="${foto.y}" width="${foto.w}" height="${foto.h}" rx="36" fill="${CORES.branco}"/>
    ${linhasTitulo
      .map((l, i) => `<text x="90" y="${690 + i * 54}" font-size="46" font-weight="700" fill="${CORES.branco}">${esc(l)}</text>`)
      .join("")}
    ${d.de ? `<text x="90" y="${linhasTitulo.length > 1 ? 800 : 760}" font-size="34" fill="${CORES.cinza}" text-decoration="line-through">De ${esc(d.de)}</text>` : ""}
    <text x="90" y="${linhasTitulo.length > 1 ? 890 : 860}" font-size="${linhasTitulo.length > 1 ? 80 : 96}" font-weight="800" fill="${CORES.volt}">${esc(d.por)}</text>
    ${chipsSvg}
    <text x="990" y="1050" font-size="24" fill="${CORES.cinza}" text-anchor="end">${esc(dominio)}</text>
  </svg>`;

  const camadas = [];
  if (fotoPng) {
    const meta = await sharp(fotoPng).metadata();
    camadas.push({
      input: fotoPng,
      left: Math.round(foto.x + (foto.w - meta.width) / 2),
      top: Math.round(foto.y + (foto.h - meta.height) / 2),
    });
  }
  // A etiqueta de desconto vai numa camada própria, por cima da foto.
  const etiqueta = d.desconto
    ? Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${TAM}" height="${TAM}" font-family="${FONTE}">
        <rect x="${foto.x + foto.w - 230}" y="${foto.y + 24}" width="206" height="96" rx="48" fill="${CORES.quente}"/>
        <text x="${foto.x + foto.w - 127}" y="${foto.y + 89}" font-size="52" font-weight="800" fill="${CORES.branco}" text-anchor="middle">-${d.desconto}%</text>
      </svg>`)
    : null;
  if (etiqueta) camadas.push({ input: etiqueta, left: 0, top: 0 });

  return sharp(Buffer.from(svg)).composite(camadas).png().toBuffer();
}

/** A imagem pode ser um arquivo do próprio site ("/images/x.svg") ou um link da loja. */
async function carregarImagem(url) {
  if (url.startsWith("/")) {
    try {
      return await readFile(path.join(PUBLIC_DIR, url));
    } catch {
      if (!config.siteUrl) throw new Error(`arquivo public${url} não encontrado`);
      url = config.siteUrl + url;
    }
  }
  const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 SimpleAthleticBot" } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ao baixar ${url}`);
  return Buffer.from(await resp.arrayBuffer());
}

function quebrarTexto(texto, porLinha, maxLinhas) {
  const palavras = texto.split(/\s+/);
  const linhas = [""];
  for (const palavra of palavras) {
    const atual = linhas[linhas.length - 1];
    if ((atual + " " + palavra).trim().length <= porLinha) linhas[linhas.length - 1] = (atual + " " + palavra).trim();
    else linhas.push(palavra);
  }
  if (linhas.length > maxLinhas) {
    const cortadas = linhas.slice(0, maxLinhas);
    cortadas[maxLinhas - 1] = cortadas[maxLinhas - 1].slice(0, porLinha - 1).trimEnd() + "…";
    return cortadas;
  }
  return linhas;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
