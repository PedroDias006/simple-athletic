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
 *  5. confere fotos extras e tamanhos à venda de até MAX_DETALHES_POR_EXECUCAO produtos (src/data/details.json,
 *     usado pela página do produto);
 *  6. grava src/data/products.json, o histórico de preços, o registro de decisões e o relatório.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { classify } from "../../src/lib/classify";
import type { Product, ProductDetails } from "../../src/types/product";
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
const ARQUIVO_DETALHES = resolve(RAIZ, "src/data/details.json");
const DADOS = resolve(__dirname, "dados");

const MAX_ATIVAS = 2500;
const MAX_NOVAS_POR_CATEGORIA = 500;
/** Quantas candidatas por categoria recebem a análise completa (cada uma custa chamadas extras à API). */
const MAX_ANALISES_POR_CATEGORIA = 700;
/** Produtos sem desconto podem ser no máximo isso vezes o número de promoções (0,8 => ~55% do site em promoção). */
const PROPORCAO_SEM_DESCONTO = 0.8;
const DIA = 24 * 60 * 60 * 1000;
/** Inativas há mais que isso saem do arquivo. */
const APAGAR_INATIVAS_APOS = 30 * DIA;
/** Sem confirmação de preço há mais que isso, a oferta sai do ar (ex.: loja desligada). */
const VALIDADE_SEM_CONFIRMAR = 2 * DIA;
/** updatedAt só muda se algo mudou ou depois disso, para não gerar commit (e deploy) toda hora. */
const RENOVAR_UPDATED_AT = 12 * 60 * 60 * 1000;
/** Fotos de produto sem tamanho são conferidas de novo depois disso. */
const RENOVAR_DETALHES = 3 * DIA;
/** Produto com tamanhos (cada um com preço e link próprios) é reconferido depois disso. */
const RENOVAR_DETALHES_COM_TAMANHO = 6 * 60 * 60 * 1000;
/** Produtos do Mercado Livre que recebem a conferência de fotos e tamanhos por execução. */
const MAX_DETALHES_POR_EXECUCAO = 100;

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
  // Falhas de rede/API ficam para o fim: se a loja inteira caiu (ex.: chave inválida), nada sai do ar por isso.
  const semResposta: { p: Product; adaptador: AdaptadorLoja; motivo: string }[] = [];
  const respondeu = new Set<AdaptadorLoja>();
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
      semResposta.push({ p, adaptador, motivo: v.motivo });
      continue;
    }
    respondeu.add(adaptador);
    if (v.status === "indisponivel") {
      desativar(p, v.motivo, log);
      continue;
    }
    // O site mostra também produtos sem promoção: preço que sobe ou promoção que acaba só atualiza o card.
    let oldPrice = v.oldPrice && v.oldPrice > v.price ? v.oldPrice : undefined;
    historico.registrar(p.id, v.price, oldPrice, agora);
    const analise = historico.analisar(p.id, v.price, oldPrice, agora);
    if (analise.inflado) {
      log.push(`  ~ ${p.id} desconto suspeito removido (${analise.motivoInflado})`);
      oldPrice = undefined;
    }
    atualizar(p, { price: v.price, oldPrice, freeShipping: v.freeShipping || undefined, affiliateUrl: v.affiliateUrl ?? p.affiliateUrl });
  }

  // Loja que não respondeu nenhuma checagem está fora do ar (chave inválida, API caída): as ofertas dela
  // ficam como estão e a execução termina com erro, para o GitHub avisar por e-mail. Só quando a loja
  // responde é que uma oferta sem confirmação há 2 dias sai do site.
  const forasDoAr = new Set(semResposta.map((s) => s.adaptador).filter((a) => !respondeu.has(a)));
  for (const a of forasDoAr) {
    const exemplo = semResposta.find((s) => s.adaptador === a)!.motivo;
    const total = semResposta.filter((s) => s.adaptador === a).length;
    aviso(`${a.nome} FORA DO AR: nenhuma das ${total} checagens funcionou (${exemplo}). Nenhuma oferta foi retirada por isso. Confira as chaves nos GitHub Secrets.`);
  }
  for (const { p, adaptador, motivo } of semResposta) {
    if (forasDoAr.has(adaptador)) continue;
    aviso(`${p.id}: não deu para rechecar (${motivo})`);
    if (agora - Date.parse(p.updatedAt) > VALIDADE_SEM_CONFIRMAR) desativar(p, "sem confirmação há 2 dias", log);
  }
  if (forasDoAr.size) process.exitCode = 1;

  // 2. Buscar ofertas novas.
  console.log("\nBuscando ofertas novas…");
  const porId = new Map(produtos.map((p) => [p.id, p]));
  const titulosAtivos = new Set(produtos.filter((p) => p.active).map((p) => `${p.store}|${normalizarTitulo(p.title)}`));
  let novas = 0;

  for (const adaptador of ativos) {
    // BOT_CATEGORIAS=futebol,corrida busca só essas (útil para testar); sem ela, todas.
    const soEstas = process.env.BOT_CATEGORIAS?.split(",").map((c) => c.trim());
    for (const categoria of categoriasDoSite.filter((c) => !soEstas || soEstas.includes(c))) {
      const encontradas = await adaptador.buscarOfertas(categoria).catch((e: Error): Oferta[] => {
        aviso(`${adaptador.nome}/${categoria}: ${e.message}`);
        return [];
      });
      // Todas entram na fila; as promoções (maior desconto) são analisadas primeiro.
      const boas = encontradas
        .filter((o) => ehCategoriaDoSite(o.category))
        .sort((a, b) => descontoPercentual(b.price, b.oldPrice) - descontoPercentual(a.price, a.oldPrice));
      const emPromocao = boas.filter((o) => descontoPercentual(o.price, o.oldPrice) >= DESCONTO_MINIMO).length;

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
        // Promoção com nota baixa fica em observação; produto de catálogo (sem promoção) entra se não foi rejeitado.
        const promocao = descontoPercentual(o.price, o.oldPrice) >= DESCONTO_MINIMO;
        if (promocao && av.prioridade === "baixa") {
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
      console.log(`  ${adaptador.nome}/${categoria}: ${encontradas.length} encontradas, ${emPromocao} com ≥${DESCONTO_MINIMO}%, ${analisadas} analisadas, ${nestaCategoria} entraram`);
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

  // A maior parte do site precisa estar em promoção: produtos sem desconto ficam em no máximo 80% do número
  // de promoções (~55% do site em promoção). Os que ficam são escolhidos alternando entre os tipos
  // (tênis, bola, legging...), para manter a variedade.
  const ativas = produtos.filter((p) => p.active && !ehDemo(p));
  const comDesconto = Math.floor(ativas.filter((p) => descontoPercentual(p.price, p.oldPrice) > 0).length * PROPORCAO_SEM_DESCONTO);
  const semDesconto = ativas.filter((p) => descontoPercentual(p.price, p.oldPrice) === 0);
  if (semDesconto.length > comDesconto) {
    const porTipo = new Map<string, Product[]>();
    for (const p of semDesconto) {
      const tipo = p.kind ?? "outro";
      if (!porTipo.has(tipo)) porTipo.set(tipo, []);
      porTipo.get(tipo)!.push(p);
    }
    // Dentro de cada tipo, os mais recentes primeiro.
    for (const lista of porTipo.values()) lista.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    const ficam = new Set<Product>();
    for (let rodada = 0; ficam.size < comDesconto; rodada++) {
      let pegou = false;
      for (const lista of porTipo.values()) {
        if (lista[rodada] && ficam.size < comDesconto) (ficam.add(lista[rodada]), (pegou = true));
      }
      if (!pegou) break;
    }
    for (const p of semDesconto) if (!ficam.has(p)) desativar(p, "equilíbrio: a maioria do site precisa ser promoção", log);
  }

  const finais = produtos.filter((p) => p.active || agora - Date.parse(p.updatedAt) <= APAGAR_INATIVAS_APOS);
  const apagadas = produtos.length - finais.length;

  // Fotos extras e tamanhos para a página do produto (details.json), aos poucos: primeiro quem não tem,
  // depois os mais antigos, no máximo MAX_DETALHES_POR_EXECUCAO por vez (cada tamanho custa uma chamada).
  console.log("\nConferindo fotos e tamanhos…");
  const detalhesAntes = existsSync(ARQUIVO_DETALHES) ? readFileSync(ARQUIVO_DETALHES, "utf8") : "{}";
  const detalhes = JSON.parse(detalhesAntes) as Record<string, ProductDetails>;
  const ativasIds = new Set(finais.filter((p) => p.active).map((p) => p.id));
  for (const id of Object.keys(detalhes)) if (!ativasIds.has(id)) delete detalhes[id];
  // Com tamanhos, o preço de cada tamanho vai para a página: reconfere bem mais vezes.
  const venceu = (p: Product) => {
    const d = detalhes[p.id];
    if (!d) return true;
    return agora - Date.parse(d.checkedAt) > (d.sizes?.length ? RENOVAR_DETALHES_COM_TAMANHO : RENOVAR_DETALHES);
  };
  const porIdade = (a: Product, b: Product) => (detalhes[a.id] ? Date.parse(detalhes[a.id].checkedAt) : 0) - (detalhes[b.id] ? Date.parse(detalhes[b.id].checkedAt) : 0);
  // Loja fora do ar nesta execução não é consultada de novo (só geraria um aviso por produto).
  const comDetalhes = finais.filter((p) => p.active && adaptadorDe(p, ativos)?.detalhar && !forasDoAr.has(adaptadorDe(p, ativos)!));
  const fila = [
    ...comDetalhes.filter((p) => adaptadorDe(p, ativos)!.detalhesSemCusto),
    ...comDetalhes.filter((p) => !adaptadorDe(p, ativos)!.detalhesSemCusto && venceu(p)).sort(porIdade).slice(0, MAX_DETALHES_POR_EXECUCAO),
  ];
  let detalhados = 0;
  for (const p of fila) {
    try {
      const d = await adaptadorDe(p, ativos)!.detalhar!(p.id);
      detalhes[p.id] = semIndefinidos({ ...(d ?? {}), checkedAt: agoraIso });
      detalhados++;
    } catch (e) {
      aviso(`${p.id}: não deu para conferir fotos e tamanhos (${(e as Error).message})`);
    }
  }
  console.log(`  ${detalhados} produtos conferidos, ${Object.keys(detalhes).length} com detalhes no arquivo.`);

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
  const conteudoDetalhes = serializarDetalhes(detalhes);
  if (conteudoDetalhes !== detalhesAntes) writeFileSync(ARQUIVO_DETALHES, conteudoDetalhes);
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

/** Um produto por linha, em ordem de id, para os diffs do git ficarem pequenos. */
function serializarDetalhes(d: Record<string, ProductDetails>) {
  const linhas = Object.keys(d).sort().map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(d[id])}`);
  return linhas.length ? `{\n${linhas.join(",\n")}\n}\n` : "{}\n";
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
