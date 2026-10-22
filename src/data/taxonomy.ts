/**
 * Árvore do catálogo, inspirada nos menus da Nike, Centauro e Adidas:
 * departamento → grupo → tipo. Cada produto cai em um único tipo (src/lib/classify.ts).
 * Para criar um tipo novo: adicione aqui e uma regra em classify.ts.
 */
export const taxonomy = [
  {
    slug: "calcados",
    label: "Calçados",
    groups: [
      { slug: "tenis", label: "Tênis", kinds: [["tenis-corrida", "Tênis de corrida"], ["tenis-treino", "Tênis de academia e treino"], ["tenis-casual", "Tênis casual"], ["tenis-quadra", "Tênis para quadra e areia"], ["tenis-outros", "Outros tênis"]] },
      { slug: "chuteiras", label: "Chuteiras", kinds: [["chuteira-campo", "Chuteiras de campo"], ["chuteira-society", "Chuteiras society"], ["chuteira-futsal", "Chuteiras de futsal"]] },
      { slug: "chinelos", label: "Chinelos e sandálias", kinds: [["chinelo", "Chinelos e sandálias"]] },
    ],
  },
  {
    slug: "roupas",
    label: "Roupas",
    groups: [
      { slug: "parte-de-cima", label: "Camisetas e blusas", kinds: [["camiseta", "Camisetas"], ["regata", "Regatas"], ["top", "Tops e sutiãs esportivos"], ["cropped", "Croppeds"], ["manga-longa", "Blusas de manga longa"], ["compressao-cima", "Camisas de compressão e segunda pele"], ["polo", "Camisas polo"], ["camisa-time", "Camisas de time"]] },
      { slug: "agasalhos", label: "Jaquetas e moletons", kinds: [["jaqueta", "Jaquetas"], ["corta-vento", "Corta-ventos"], ["moletom", "Moletons e agasalhos"]] },
      { slug: "parte-de-baixo", label: "Shorts, calças e leggings", kinds: [["legging", "Leggings"], ["shorts", "Shorts"], ["short-saia", "Shorts-saia e saias"], ["bermuda", "Bermudas"], ["compressao-baixo", "Shorts e calças de compressão"], ["calca", "Calças"], ["jogger", "Calças jogger"]] },
      { slug: "conjuntos", label: "Conjuntos e macaquinhos", kinds: [["conjunto", "Conjuntos"], ["macaquinho", "Macaquinhos e bodies"]] },
      { slug: "praia", label: "Natação e praia", kinds: [["praia", "Maiôs, sungas e biquínis"]] },
      { slug: "meias", label: "Meias", kinds: [["meia", "Meias e meiões"]] },
    ],
  },
  {
    slug: "acessorios",
    label: "Acessórios",
    groups: [
      { slug: "cabeca", label: "Cabeça e rosto", kinds: [["bone", "Bonés, viseiras e toucas"], ["oculos", "Óculos"], ["faixa", "Faixas e testeiras"]] },
      { slug: "bolsas", label: "Bolsas e hidratação", kinds: [["mochila", "Mochilas e bolsas"], ["pochete", "Pochetes e cintos de corrida"], ["garrafa", "Garrafas e squeezes"]] },
      { slug: "tecnologia", label: "Tecnologia", kinds: [["relogio", "Relógios e monitores"]] },
      { slug: "treino", label: "Para o treino", kinds: [["luva", "Luvas de academia"]] },
    ],
  },
  {
    slug: "equipamentos",
    label: "Equipamentos",
    groups: [
      { slug: "raquetes", label: "Raquetes", kinds: [["raquete-tenis", "Raquetes de tênis"], ["raquete-beach", "Raquetes de beach tennis"], ["raquete-padel", "Raquetes de padel"], ["raquete-mesa", "Tênis de mesa"], ["acessorio-raquete", "Grips, capas e antivibradores"]] },
      { slug: "bolas", label: "Bolas", kinds: [["bola-futebol", "Bolas de futebol"], ["bola-raquete", "Bolas de tênis e beach tennis"], ["bola-volei", "Bolas de vôlei"], ["bola-basquete", "Bolas de basquete"], ["bola-outros", "Outras bolas"]] },
      { slug: "musculacao", label: "Musculação e fitness", kinds: [["peso", "Halteres, anilhas e kettlebells"], ["elastico", "Elásticos e extensores"], ["tapete", "Tapetes e colchonetes"], ["acessorio-treino", "Cordas, rodas e bolas de pilates"]] },
      { slug: "futebol", label: "Futebol", kinds: [["goleiro", "Luvas de goleiro"], ["caneleira", "Caneleiras"], ["treino-futebol", "Cones, coletes e redes"]] },
      { slug: "lutas", label: "Lutas", kinds: [["luva-luta", "Luvas de boxe e MMA"]] },
      { slug: "natacao", label: "Natação", kinds: [["natacao", "Óculos, toucas e acessórios"]] },
    ],
  },
  {
    slug: "lesao-e-recuperacao",
    label: "Lesão e recuperação",
    groups: [
      { slug: "suportes", label: "Joelheiras e suportes", kinds: [["joelheira", "Joelheiras"], ["tornozeleira", "Tornozeleiras"], ["munhequeira", "Munhequeiras e cotoveleiras"], ["cinta", "Cintas lombares e posturais"]] },
      { slug: "alivio", label: "Alívio da dor", kinds: [["gelo", "Bolsas de gelo e compressas"], ["massagem", "Rolos e massageadores"], ["bandagem", "Fitas kinesio e bandagens"]] },
      { slug: "compressao", label: "Compressão", kinds: [["compressao", "Meias e mangas de compressão"]] },
    ],
  },
  {
    slug: "suplementos",
    label: "Suplementos",
    groups: [
      { slug: "suplementos", label: "Suplementos", kinds: [["proteina", "Proteínas"], ["creatina", "Creatina"], ["pretreino", "Pré-treino e energia"], ["suplemento-outros", "Vitaminas e outros"]] },
    ],
  },
] as const;

type Tax = typeof taxonomy;
export type DepartmentSlug = Tax[number]["slug"];
export type GroupSlug = Tax[number]["groups"][number]["slug"];
export type KindSlug = Tax[number]["groups"][number]["kinds"][number][0] | "outro";

/** Estilos de roupa, como as linhas "Performance", "Sportswear" e "Torcedor" das marcas. */
export const styles = [
  { slug: "treino", label: "Treino e academia" },
  { slug: "corrida", label: "Corrida" },
  { slug: "compressao", label: "Compressão e térmicas" },
  { slug: "casual", label: "Casual e dia a dia" },
  { slug: "torcedor", label: "Torcedor" },
  { slug: "praia", label: "Praia e natação" },
] as const;
export type StyleSlug = (typeof styles)[number]["slug"];

export interface KindInfo {
  slug: KindSlug;
  label: string;
  group: GroupSlug | "outros";
  groupLabel: string;
  department: DepartmentSlug;
}

export const kindInfo = Object.fromEntries(
  taxonomy.flatMap((d) => d.groups.flatMap((g) => g.kinds.map(([slug, label]) => [slug, { slug, label, group: g.slug, groupLabel: g.label, department: d.slug }]))),
) as Record<Exclude<KindSlug, "outro">, KindInfo>;

/** Produto sem tipo reconhecido fica em Equipamentos → Outros. */
export function infoOf(kind: KindSlug): KindInfo {
  return kind === "outro"
    ? { slug: "outro", label: "Outros", group: "outros", groupLabel: "Outros", department: "equipamentos" }
    : kindInfo[kind];
}

export const departmentSlugs = taxonomy.map((d) => d.slug) as DepartmentSlug[];

export interface GroupNode {
  slug: GroupSlug;
  label: string;
  kinds: readonly (readonly [Exclude<KindSlug, "outro">, string])[];
}

/** Grupos de um departamento (ou de todos), na ordem do menu. */
export function groupsOf(department?: DepartmentSlug): GroupNode[] {
  return taxonomy.filter((d) => !department || d.slug === department).flatMap((d) => d.groups as readonly GroupNode[]);
}
