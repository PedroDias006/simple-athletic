/**
 * Bot de promoções do SIMPLE ATHLETIC.
 * Rode com: npm run bot:promocoes   (simular sem gravar: npm run bot:promocoes -- --seco)
 *
 * A cada execução:
 *  1. recheca as ofertas ativas (preço subiu, esgotou, expirou, desconto suspeito -> active:false);
 *  2. busca ofertas novas com desconto >= 15% nas categorias do site, sem duplicatas;
 *  3. avalia cada candidata (reputação, avaliações, estoque, histórico de preço) com nota de 0 a 100
 *     e só publica prioridade alta ou média; as demais ficam em observação ou são rejeitadas com motivo;
 *  4. mantém no máximo MAX_ATIVAS e apaga inativas com mais de 30 dias;
 *  5. grava src/data/products.json, o histórico de preços, o registro de decisões e o relatório.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { classify } from "../../src/lib/classify";
import type { Product } from "../../src/types/product";
import { avaliar } from "./avaliacao";
import { categoriasDoSite, ehCategoriaDoSite } from "./categorias";
import { Historico } from "./historico";
import { amazon } from "./lojas/amazon";
import { mercadoLivre } from "./lojas/mercadolivre";
import { awin } from "./lojas/awin";
import { lomadee } from "./lojas/redes";
import { shopee } from "./lojas/shopee";
import { Memoria } from "./memoria";
import { aviso, avisosDaExecucao, DESCONTO_MINIMO, descontoPercentual, type AdaptadorLoja, type Oferta } from "./tipos";

const RAIZ = resolve(__dirname, "../..");
const ARQUIVO = resolve(RAIZ, "src/data/products.json");
const NEXT_CONFIG = resolve(RAIZ, "next.config.ts");
const DADOS = resolve(__dirname, "dados");

const MAX_ATIVAS = 600;
const MAX_NOVAS_POR_CATEGORIA = 80;
/** Quantas candidatas por categoria recebem a análise completa (cada uma custa chamadas extras à API). */
const MAX_ANALISES_POR_CATEGORIA = 120;
const DIA = 24 * 60 * 60 * 1000;
/** Inativas há mais que isso saem do arquivo. */
const APAGAR_INATIVAS_APOS = 30 * DIA;
/** Sem confirmação de preço há mais que isso, a oferta sai do ar (ex.: loja desligada). */
const VALIDADE_SEM_CONFIRMAR = 2 * DIA;
/** updatedAt só muda se algo mudou ou depois disso, para não gerar commit (e deploy) toda hora. */
const RENOVAR_UPDATED_AT = 12 * 60 * 60 * 1000;

const TODOS_ADAPTADORES: AdaptadorLoja[] = [mercadoLivre, amazon, shopee, awin, lomadee];

// Chaves do bot ficam em bots/promocoes/.env (fora do .env.local, que o build do site embute no servidor).
// Sem o arquivo, usa só as variáveis do ambiente (GitHub Secrets no Actions).
try {
  process.loadEnvFile(resolve(__dirname, ".env"));
} catch {
  // sem arquivo local
}

const seco = process.argv.includes("--seco");
const agora = Date.now();
const agoraIso = new Date(agora).toISOString();
const ehDemo = (p: Product) => p.id.startsWith("demo-");
const historico = new Historico(resolve(DADOS, "historico.json"));
const memoria = new Memoria(DADOS, agora);

function adaptadorDe(p: Product, ativos: AdaptadorLoja[]) {
  return ativos.find((a) => p.id.startsWith(a.prefixo));
}

function normalizarTitulo(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function desativar(p: Product, motivo: string, log: string[]) {
  if (!p.active) return;
  p.active = false;
  log.push(`  − ${p.id} (${motivo})`);
  if (!ehDemo(p)) memoria.registrar(p.id, p.title, "retirada", { preco: p.price, precoDe: p.oldPrice, motivos: [motivo] });
}

async function main() {
  const original = readFileSync(ARQUIVO, "utf8");
  const produtos = JSON.parse(original) as Product[];
  const log: string[] = [];

  const ativos = TODOS_ADAPTADORES.filter((a) => {
    const motivo = a.motivoDesligado();
    if (motivo) console.log(`· ${a.nome}: desligado — ${motivo}`);
    else console.log(`✓ ${a.nome}: ligado`);
    return !motivo;
  });
  if (!ativos.length) aviso("Nenhuma loja configurada. Veja bots/promocoes/README.md.");

  // 1. Rechecar o que já está no ar.
  console.log("\nRechecando ofertas ativas…");
  for (const p of produtos.filter((p) => p.active && !ehDemo(p))) {
    if (p.expiresAt && Date.parse(p.expiresAt) <= agora) {
      desativar(p, "expirou", log);
      continue;
    }
    const adaptador = adaptadorDe(p, ativos);
    if (!adaptador) {
      if (agora - Date.parse(p.updatedAt) > VALIDADE_SEM_CONFIRMAR) desativar(p, "sem confirmação há 2 dias", log);
      continue;
    }
    const v = await adaptador.verificarOferta(p.id);
    if (v.status === "erro") {
      aviso(`${p.id}: não deu para rechecar (${v.motivo})`);
      if (agora - Date.parse(p.updatedAt) > VALIDADE_SEM_CONFIRMAR) desativar(p, "sem confirmação há 2 dias", log);
      continue;
    }
    if (v.status === "indisponivel") {
      desativar(p, v.motivo, log);
      continue;
    }
    if (v.price > p.price) {
      desativar(p, `preço subiu de ${p.price} para ${v.price}`, log);
      continue;
    }
    const oldPrice = v.oldPrice ?? p.oldPrice;
    historico.registrar(p.id, v.price, oldPrice, agora);
    if (descontoPercentual(v.price, oldPrice) < DESCONTO_MINIMO) {
      desativar(p, "desconto abaixo de 15%", log);
      continue;
    }
    const analise = historico.analisar(p.id, v.price, oldPrice, agora);
    if (analise.inflado) {
      desativar(p, `desconto suspeito: ${analise.motivoInflado}`, log);
      continue;
    }
    atualizar(p, { price: v.price, oldPrice, freeShipping: v.freeShipping || undefined, affiliateUrl: v.affiliateUrl ?? p.affiliateUrl });
  }

  // 2. Buscar ofertas novas.
  console.log("\nBuscando ofertas novas…");
  const porId = new Map(produtos.map((p) => [p.id, p]));
  const titulosAtivos = new Set(produtos.filter((p) => p.active).map((p) => `${p.store}|${normalizarTitulo(p.title)}`));
  let novas = 0;

  for (const adaptador of ativos) {
    for (const categoria of categoriasDoSite) {
      const encontradas = await adaptador.buscarOfertas(categoria).catch((e: Error): Oferta[] => {
        aviso(`${adaptador.nome}/${categoria}: ${e.message}`);
        return [];
      });
      const boas = encontradas
        .filter((o) => ehCategoriaDoSite(o.category) && descontoPercentual(o.price, o.oldPrice) >= DESCONTO_MINIMO)
        .sort((a, b) => descontoPercentual(b.price, b.oldPrice) - descontoPercentual(a.price, a.oldPrice));

      let nestaCategoria = 0;
      let analisadas = 0;
      for (const bruta of boas) {
        if (nestaCategoria >= MAX_NOVAS_POR_CATEGORIA || analisadas >= MAX_ANALISES_POR_CATEGORIA) break;
        const existente = porId.get(bruta.id);
        if (existente?.active) continue; // já no ar (e já rechecada acima)
        const chaveTitulo = `${bruta.store}|${normalizarTitulo(bruta.title)}`;
        if (titulosAtivos.has(chaveTitulo)) continue; // mesmo produto em outro anúncio

        // Análise completa: reputação, avaliações, estoque e histórico de preço.
        analisadas++;
        const o = adaptador.enriquecer ? await adaptador.enriquecer(bruta).catch(() => bruta) : bruta;
        historico.registrar(o.id, o.price, o.oldPrice, agora);
        const av = avaliar(o, historico.analisar(o.id, o.price, o.oldPrice, agora));
        const extra = { preco: o.price, precoDe: o.oldPrice, avaliacao: av };
        if (av.prioridade === "rejeitada") {
          memoria.registrar(o.id, o.title, "rejeitada", extra);
          continue;
        }
        if (av.prioridade === "baixa") {
          memoria.registrar(o.id, o.title, "observacao", extra);
          continue;
        }

        // Gênero, tipo e cores: o que a loja informou vale; o resto vem do título (src/lib/classify.ts).
        const { sinais: _sinais, ...semSinais } = o;
        const dadosDoSite = classify({ ...semSinais, updatedAt: agoraIso, active: true });
        if (existente) {
          // Voltou a ficar em promoção: reaproveita o registro.
          Object.assign(existente, dadosDoSite, { active: true, updatedAt: agoraIso });
          log.push(`  ↺ ${o.id} voltou (${descontoPercentual(o.price, o.oldPrice)}% off, nota ${av.nota})`);
        } else {
          const novo: Product = semIndefinidos(dadosDoSite);
          produtos.push(novo);
          porId.set(novo.id, novo);
          log.push(`  + ${o.id} ${o.title.slice(0, 50)} (${descontoPercentual(o.price, o.oldPrice)}% off, nota ${av.nota}, ${av.prioridade}) [${novo.kind}/${novo.gender}/${novo.colors?.join(",") || "-"}]`);
        }
        memoria.registrar(o.id, o.title, "publicada", extra);
        titulosAtivos.add(chaveTitulo);
        nestaCategoria++;
        novas++;
      }
      console.log(`  ${adaptador.nome}/${categoria}: ${encontradas.length} encontradas, ${boas.length} com ≥${DESCONTO_MINIMO}%, ${analisadas} analisadas, ${nestaCategoria} entraram`);
    }
  }

  // Gênero, tipo, cores e estilo de todas as ofertas passam pelo classify() do site (mantém o que já veio da loja).
  for (let i = 0; i < produtos.length; i++) produtos[i] = semIndefinidos(classify(produtos[i]));

  // Ofertas de exemplo saem do ar assim que existem ofertas reais.
  const reais = produtos.filter((p) => p.active && !ehDemo(p)).length;
  if (reais > 0) for (const p of produtos.filter(ehDemo)) desativar(p, "oferta de exemplo", log);

  // 3. Limite de ativas (ficam as de maior desconto) e limpeza das antigas.
  const ativasOrdenadas = produtos.filter((p) => p.active).sort((a, b) => descontoPercentual(b.price, b.oldPrice) - descontoPercentual(a.price, a.oldPrice));
  for (const p of ativasOrdenadas.slice(MAX_ATIVAS)) desativar(p, `passou do limite de ${MAX_ATIVAS}`, log);

  const finais = produtos.filter((p) => p.active || agora - Date.parse(p.updatedAt) <= APAGAR_INATIVAS_APOS);
  const apagadas = produtos.length - finais.length;

  // 4. Gravar.
  console.log(`\n${log.length ? log.join("\n") : "  (nenhuma mudança de status)"}`);
  console.log(`\nResumo: ${finais.filter((p) => p.active).length} ativas, ${novas} novas, ${apagadas} apagadas, ${finais.length} no arquivo.`);

  const conteudo = serializar(finais);
  if (conteudo === original) {
    console.log("products.json sem mudanças.");
  } else if (seco) {
    console.log("--seco: products.json NÃO foi gravado.");
  } else {
    writeFileSync(ARQUIVO, conteudo);
    console.log("products.json atualizado.");
  }
  if (seco) return;
  garantirHostsDeImagem(finais);

  // Memória: histórico de preços, decisões e relatório.
  historico.limpar(agora);
  historico.salvar();
  for (const a of avisosDaExecucao) memoria.aviso(a);
  memoria.salvarDecisoes();
  memoria.salvarRelatorio({
    lojas: ativos.map((a) => a.nome),
    ativas: finais.filter((p) => p.active).length,
    historico: historico.tamanho,
    limitacoes: [
      "Comissão por produto não é informada pela API: o critério \"retorno\" fica de fora da nota.",
      "Cliques, vendas e comissões ainda não são medidos (o painel de afiliados não tem API pública); por enquanto, sem análise financeira.",
      "Desconto \"verificado\" exige ao menos 3 observações em 3 dias do próprio bot; antes disso vale o preço \"de\" anunciado pela loja.",
    ],
  });
  console.log("Relatório: bots/promocoes/dados/relatorio.md");
}

/** Aplica dados novos e só renova updatedAt se algo mudou ou se já está velho. */
function atualizar(p: Product, dados: Partial<Product>) {
  const antes = JSON.stringify(p);
  Object.assign(p, dados);
  for (const k of Object.keys(p) as (keyof Product)[]) if (p[k] === undefined) delete p[k];
  if (JSON.stringify(p) !== antes || agora - Date.parse(p.updatedAt) > RENOVAR_UPDATED_AT) p.updatedAt = agoraIso;
}

function semIndefinidos<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

/** Mesmo estilo do arquivo original: uma oferta por linha, campos na ordem do tipo Product. */
const ORDEM: (keyof Product)[] = ["id", "title", "brand", "category", "gender", "kind", "colors", "style", "store", "price", "oldPrice", "imageUrl", "affiliateUrl", "rating", "reviews", "coupon", "freeShipping", "expiresAt", "updatedAt", "active"];
function serializar(lista: Product[]) {
  const linhas = lista.map((p) => {
    const campos = ORDEM.filter((k) => p[k] !== undefined).map((k) => `${JSON.stringify(k)}: ${JSON.stringify(p[k])}`);
    return `  { ${campos.join(", ")} }`;
  });
  return `[\n${linhas.join(",\n")}\n]\n`;
}

/** Acrescenta em next.config.ts (lista imageHosts) os domínios de imagem que ainda não estão lá. */
function garantirHostsDeImagem(lista: Product[]) {
  const config = readFileSync(NEXT_CONFIG, "utf8");
  const bloco = config.match(/const imageHosts = \[([\s\S]*?)\];/);
  if (!bloco) {
    aviso("Não achei a lista imageHosts em next.config.ts; confira os domínios de imagem manualmente.");
    return;
  }
  const conhecidos = new Set([...bloco[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
  const faltando = new Set<string>();
  for (const p of lista) {
    if (!p.imageUrl.startsWith("http")) continue;
    const host = new URL(p.imageUrl).hostname;
    if (!conhecidos.has(host)) faltando.add(host);
  }
  if (!faltando.size) return;
  const novos = [...faltando].map((h) => `  "${h}",\n`).join("");
  writeFileSync(NEXT_CONFIG, config.replace(bloco[0], `const imageHosts = [${bloco[1].replace(/\s*$/, "\n")}${novos}];`));
  console.log(`next.config.ts: hosts de imagem adicionados: ${[...faltando].join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
