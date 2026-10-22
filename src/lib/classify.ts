import { infoOf, kindInfo, type DepartmentSlug, type KindSlug, type StyleSlug } from "../data/taxonomy";
import type { ColorSlug, Gender, Product } from "../types/product";

/**
 * Deduz tipo, gênero, cores e estilo pelo título do anúncio. Usado pelo site e pelo bot de promoções.
 * A ordem das regras importa: a primeira que bate vence. Por isso as mais específicas vêm antes
 * ("bola de massagem" é massagem, "raquete de tênis" é raquete, "tornozeleira de peso" é peso).
 */
const kindRules: [KindSlug, RegExp][] = [
  // suplementos
  ["proteina", /\b(whey|albumina|proteina|isolad[oa]|barra de proteina|caseina)\b/],
  ["creatina", /\bcreatina\b/],
  ["pretreino", /\b(pre.?treino|cafeina|termogenico|gel de carboidrato|carboidrato em gel|energetico)\b/],
  ["suplemento-outros", /\b(bcaa|colageno|glutamina|multivitaminico|vitamina|omega 3|hipercalorico|aminoacido|maltodextrina)\b/],

  // musculação: antes de joelheira/caneleira por causa das "de peso"
  ["peso", /\b(halter|halteres|anilhas?|kettlebell|dumbbell|(caneleira|tornozeleira) de peso|barra (de )?(musculacao|supino|olimpica|w))\b/],

  // lesão e recuperação
  ["bandagem", /\b(kinesio|bandagem|esparadrapo|tape|fita (adesiva|terapeutica|elastica adesiva))\b/],
  ["joelheira", /\bjoelheiras?\b/],
  ["tornozeleira", /\btornozeleiras?\b/],
  ["munhequeira", /\b(munhequeiras?|cotoveleiras?|ombreiras?|tala de punho|protetor de punho)\b/],
  ["cinta", /\b(cinta (lombar|postural|abdominal|ergonomica)|colete postural|corretor (de )?postur)/],
  ["gelo", /\b(bolsa|compressa)s?\b.*\b(gelo|termica|quente|fria|gel)\b|\bgelo\b/],
  ["massagem", /\b(massag|massageador|miofascial|foam roller|rolo|pistola|liberacao)/],
  ["compressao", /\b(meias?|manguitos?|canelitos?|panturrilha)\b.*\bcompress|\bcompress\w*\b.*\b(meias?|manguitos?|panturrilha)\b|\b(manguito|canelito)\b/],

  // raquetes e bolas
  ["acessorio-raquete", /\b(antivibrador|overgrip|grip|raqueteira|capa (de|para) raquete|corda (de|para) raquete|protetor de raquete)\b/],
  ["bola-raquete", /\b(bola|bolas|bolinhas?)\b.*\b(tenis|beach|padel|squash)\b/],
  ["raquete-mesa", /\b(tenis de mesa|ping.?pong)\b/],
  ["raquete-beach", /\braquete\b.*\b(beach|praia)\b|\bbeach tennis\b.*\braquete\b/],
  ["raquete-padel", /\b(padel|paddle)\b/],
  ["raquete-tenis", /\braquetes?\b/],
  ["natacao", /\b(oculos|touca) (de |para )?natacao\b|\b(nadadeira|prancha de natacao|protetor de ouvido)\b/],
  ["acessorio-treino", /\b(corda de pular|roda abdominal|step|bola (suica|de pilates|de yoga)|bosu|hand.?grip|barra fixa|paralela|strap|cinto de musculacao)\b/],
  ["bola-basquete", /\bbola\b.*\bbasquete\b/],
  ["bola-volei", /\bbola\b.*\bvolei\b/],
  ["bola-futebol", /\bbola\b.*\b(futebol|futsal|society|campo)\b|\bbola de futebol\b/],
  ["bola-outros", /\b(bola|bolas)\b/],

  // futebol e lutas
  ["goleiro", /\bgoleiro\b/],
  ["caneleira", /\bcaneleiras?\b/],
  ["treino-futebol", /\b(cones?|colete de treino|rede (de|para) gol|escada de agilidade|apito|bomba (de ar|de encher|para bola))\b/],
  ["luva-luta", /\bluvas?\b.*\b(boxe|muay|mma|kickboxing|bate saco)\b/],

  // calçados
  ["chuteira-futsal", /\bchuteira\b.*\b(futsal|salao|indoor|ic)\b/],
  ["chuteira-society", /\bchuteira\b.*\b(society|tf)\b/],
  ["chuteira-campo", /\bchuteira/],
  ["chinelo", /\b(chinelo|sandalia|slide|papete)\b/],
  ["tenis-corrida", /\btenis\b.*\b(corrida|running|run|caminhada|maratona|trail)\b/],
  ["tenis-quadra", /\btenis\b.*\b(quadra|beach|padel|squash|saibro|clay|volei|handebol)\b/],
  ["tenis-treino", /\btenis\b.*\b(academia|treino|training|cross|fitness|musculacao|funcional)\b/],
  ["tenis-casual", /\btenis\b.*\b(casual|lifestyle|skate|cano|branco|air force|dunk|jordan|old skool|sneaker|couro|retro)\b/],
  ["tenis-outros", /\btenis\b/],

  // roupas
  ["praia", /\b(maio|sunga|biquini|bermuda de praia|short de praia|rash guard)\b/],
  ["conjunto", /\bconjunto\b/],
  ["macaquinho", /\b(macaquinho|macacao|body)\b/],
  ["top", /\b(top|sutia|bra)\b/],
  ["legging", /\b(legging|leggings|leg)\b/],
  ["bermuda", /\bbermuda\b/],
  ["shorts", /\b(short|shorts|saia|calcao)\b/],
  ["calca", /\b(calca|jogger)\b/],
  ["camisa-time", /\bcamisa\b.*\b(time|clube|selecao|oficial|torcedor|jogo)\b|\bcamisa (do |da )?(flamengo|corinthians|palmeiras|sao paulo|santos|vasco|gremio|internacional|cruzeiro|atletico|botafogo|fluminense|brasil|real madrid|barcelona)\b|\buniforme\b/],
  ["moletom", /\b(moletom|agasalho|blusao|blusa de frio|fleece)\b/],
  ["jaqueta", /\b(jaqueta|corta.?vento|casaco|windbreaker|anorak)\b/],
  ["regata", /\bregata\b/],
  ["camiseta", /\b(camiseta|camisa|blusa|cropped|baby.?look|t.?shirt|polo)\b/],
  ["meia", /\b(meia|meias|meiao|meioes)\b/],

  // acessórios
  ["oculos", /\boculos\b/],
  ["bone", /\b(bone|viseira|touca|chapeu|bucket)\b/],
  ["faixa", /\b(faixa de cabelo|headband|testeira|tiara|faixa para cabelo)\b/],
  ["pochete", /\b(pochete|cinto (de )?(corrida|hidratacao)|porta celular|bracadeira)\b/],
  ["relogio", /\b(relogio|smartwatch|smartband|monitor cardiaco|cinta cardiaca|frequencimetro)\b/],
  ["garrafa", /\b(garrafa|garrafinha|squeeze|coqueteleira|copo termico)\b/],
  ["mochila", /\b(mochila|bolsa|sacola|necessaire|mala|bag)\b/],
  ["luva", /\bluvas?\b/],

  // musculação (genéricos, por último)
  ["elastico", /\b(elastic|extensor|mini.?band|super.?band|faixa elastica|tubing)/],
  ["tapete", /\b(tapete|colchonete|yoga mat|mat)\b/],
];

const styleRules: [StyleSlug, RegExp][] = [
  ["compressao", /\b(compressao|segunda pele|termica|termico)\b/],
  ["corrida", /\b(corrida|running|run|maratona|trail)\b/],
  ["treino", /\b(academia|treino|fitness|dry.?fit|training|cross|yoga|pilates|musculacao|esportiv[oa])\b/],
  ["casual", /\b(casual|lifestyle|algodao|basic[oa]|oversized|streetwear|essentials)\b/],
];

const colorRules: [ColorSlug, RegExp][] = [
  ["preto", /\b(pret[oa]s?|black|negr[oa])\b/],
  ["branco", /\b(branc[oa]s?|white|off.?white)\b/],
  ["cinza", /\b(cinza|grafite|chumbo|mescla|prata)\b/],
  ["azul", /\b(azul|marinho|navy|turquesa|celeste|royal)\b/],
  ["vermelho", /\b(vermelh[oa]s?|bordo|vinho|red)\b/],
  ["verde", /\b(verde|militar|oliva|menta|lima)\b/],
  ["amarelo", /\b(amarel[oa]s?|dourad[oa]|mostarda|ouro)\b/],
  ["laranja", /\b(laranja|coral)\b/],
  ["rosa", /\b(rosa|pink|pessego|magenta|fucsia)\b/],
  ["roxo", /\b(rox[oa]|lilas|violeta|lavanda|uva)\b/],
  ["bege", /\b(bege|nude|areia|creme|caqui)\b/],
  ["marrom", /\b(marrom|caramelo|chocolate|cafe)\b/],
  ["colorido", /\b(estampad[oa]|colorid[oa]|multicolor|tie.?dye|camuflad[oa])\b/],
];

const feminine = /\b(feminin[oa]s?|mulher(es)?|women|womens|wmns|dela|gestante|menina)\b/;
const masculine = /\b(masculin[oa]s?|homem|homens|men|mens|menino)\b/;
const feminineKinds: KindSlug[] = ["top", "macaquinho"];

export function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function inferKind(title: string): KindSlug {
  const t = normalize(title);
  return kindRules.find(([, re]) => re.test(t))?.[0] ?? "outro";
}

export function inferGender(title: string, kind = inferKind(title)): Gender {
  const t = normalize(title);
  const f = feminine.test(t) || /\b(biquini|maio)\b/.test(t);
  const m = masculine.test(t) || /\bsunga\b/.test(t);
  if (f && !m) return "feminino";
  if (m && !f) return "masculino";
  if (feminineKinds.includes(kind)) return "feminino";
  return "unissex";
}

export function inferColors(title: string): ColorSlug[] {
  const t = normalize(title);
  return colorRules.filter(([, re]) => re.test(t)).map(([c]) => c);
}

/** Estilo só faz sentido para roupas. */
export function inferStyle(title: string, kind = inferKind(title)): StyleSlug | undefined {
  if (infoOf(kind).department !== "roupas") return undefined;
  if (kind === "camisa-time") return "torcedor";
  if (kind === "praia") return "praia";
  const t = normalize(title);
  return styleRules.find(([, re]) => re.test(t))?.[0];
}

const isKnownKind = (k: unknown): k is KindSlug => typeof k === "string" && k in kindInfo;

/**
 * Preenche kind, gender, colors e style. O título manda no tipo (as regras evoluem mais rápido que
 * os dados salvos); o kind gravado só é usado quando o título não diz nada.
 */
export function classify<T extends Product>(p: T): T & Required<Pick<Product, "gender" | "kind" | "colors">> & Pick<Product, "style"> {
  const inferred = inferKind(p.title);
  const kind = inferred === "outro" && isKnownKind(p.kind) ? p.kind : inferred;
  return {
    ...p,
    kind,
    gender: p.gender ?? inferGender(p.title, kind),
    colors: p.colors?.length ? p.colors : inferColors(p.title),
    style: p.style ?? inferStyle(p.title, kind),
  };
}

export function departmentOf(p: Pick<Product, "kind" | "title">): DepartmentSlug {
  return infoOf(p.kind && isKnownKind(p.kind) ? p.kind : inferKind(p.title)).department;
}

/**
 * O que aparece no modo feminino: roupas e calçados femininos, mais acessórios,
 * equipamentos, itens de recuperação e suplementos que não sejam masculinos.
 */
export function isForWomen(p: Product): boolean {
  const c = classify(p);
  if (c.gender === "feminino") return true;
  if (c.gender === "masculino") return false;
  const dept = infoOf(c.kind).department;
  return dept !== "roupas" && dept !== "calcados";
}
