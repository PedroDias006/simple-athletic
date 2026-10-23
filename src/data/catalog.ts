import type { CategorySlug, ColorSlug, DepartmentSlug, GroupSlug, KindSlug, StoreId } from "@/types/product";
import { kindInfo, styles, taxonomy } from "./taxonomy";

export interface Category {
  slug: CategorySlug;
  label: string;
  description: string;
  emoji: string;
  /** Foto de campanha usada nos blocos de categoria (Unsplash). */
  image: string;
  /** Termos que aparecem em "Mais buscados" e levam para a busca. */
  searches: string[];
}

/** Monta a URL de uma foto do Unsplash já recortada no tamanho certo. */
export const unsplash = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const categories: Category[] = [
  { slug: "futebol", label: "Futebol", description: "Chuteiras, bolas e camisas com desconto de verdade.", emoji: "⚽", image: unsplash("1574629810360-7efbbe195018"), searches: ["Chuteira society", "Chuteira futsal", "Chuteira de campo", "Bola de futebol", "Camisa de time", "Caneleira"] },
  { slug: "corrida", label: "Corrida", description: "Tênis, relógios e acessórios para baixar seu pace.", emoji: "🏃", image: unsplash("1590333748338-d629e4564ad9"), searches: ["Tênis de corrida", "Relógio GPS", "Meia de compressão", "Viseira", "Cinto de hidratação"] },
  { slug: "raquetes", label: "Raquetes", description: "Tênis, beach tennis, padel e squash.", emoji: "🎾", image: unsplash("1554068865-24cecd4e34b8"), searches: ["Raquete de beach tennis", "Raquete de tênis", "Raquete de padel", "Bola de tênis", "Grip"] },
  { slug: "musculacao", label: "Musculação", description: "Halteres, elásticos e tudo para o treino em casa ou na academia.", emoji: "🏋️", image: unsplash("1517836357463-d25dfeac3438"), searches: ["Halter", "Anilha", "Kettlebell", "Elástico extensor", "Luva de treino"] },
  { slug: "suplementos", label: "Suplementos", description: "Whey, creatina e pré-treino pelo menor preço.", emoji: "🥤", image: unsplash("1558017487-06bf9f82613a"), searches: ["Whey protein", "Creatina", "Pré-treino", "Coqueteleira", "Barra de proteína"] },
  { slug: "recuperacao", label: "Recuperação", description: "Rolos, massageadores e compressão.", emoji: "🧊", image: unsplash("1593431763017-c689a61b729a"), searches: ["Rolo miofascial", "Pistola massageadora", "Bola de massagem", "Bolsa de gelo"] },
  { slug: "casual", label: "Casual", description: "Tênis e roupas esportivas para o dia a dia.", emoji: "👟", image: unsplash("1615440321519-dda3d4b5ccab"), searches: ["Air Force 1", "Tênis branco", "Moletom", "Boné", "Mochila"] },
];

/** Departamentos: cada um tem página própria (/calcados, /roupas...) com grupos, tipos e cores. */
export interface Department {
  slug: DepartmentSlug;
  label: string;
  description: string;
  descriptionFem: string;
  image: string;
  imageFem: string;
  /** Foto do modo masculino; sem ela, usa a padrão. */
  imageMasc?: string;
}

/** Foto e texto do departamento conforme o modo do site. */
export function departmentLook(d: Department, mode: "todos" | "feminino" | "masculino") {
  if (mode === "feminino") return { image: d.imageFem, description: d.descriptionFem };
  return { image: (mode === "masculino" && d.imageMasc) || d.image, description: d.description };
}

const departmentPhotos: Record<DepartmentSlug, Omit<Department, "slug" | "label">> = {
  calcados: { description: "Tênis de corrida, de academia, casuais e de quadra, chuteiras e chinelos.", descriptionFem: "Tênis femininos para correr, treinar, jogar e usar no dia a dia.", image: unsplash("1556906781-9a412961c28c", 900), imageFem: unsplash("1560769629-975ec94e6a86", 900) },
  roupas: { description: "Camisetas, regatas, shorts, calças, jaquetas e camisas de time.", descriptionFem: "Leggings, tops, shorts, conjuntos e jaquetas pensados para o corpo feminino.", image: unsplash("1521572163474-6864f9cf17ab", 900), imageFem: unsplash("1594381898411-846e7d193883", 900), imageMasc: unsplash("1581009146145-b5ef050c2e1e", 900) },
  acessorios: { description: "Bonés, óculos, mochilas, garrafas, relógios e luvas para o dia a dia do treino.", descriptionFem: "Bolsas, garrafas, faixas de cabelo, óculos e relógios para o seu treino.", image: unsplash("1616066753769-b46d9d825331", 900), imageFem: unsplash("1599058917212-d750089bc07e", 900) },
  equipamentos: { description: "Raquetes de tênis, beach tennis e padel, bolas, pesos e equipamentos de cada esporte.", descriptionFem: "Raquetes, tapetes, elásticos, pesos e equipamentos para o seu esporte.", image: unsplash("1576678927484-cc907957088c", 900), imageFem: unsplash("1434596922112-19c563067271", 900) },
  "lesao-e-recuperacao": { description: "Joelheiras, tornozeleiras, bolsas de gelo, rolos de massagem e compressão para tratar e prevenir lesões.", descriptionFem: "Joelheiras, tornozeleiras, bolsas de gelo, rolos de massagem e compressão para tratar e prevenir lesões.", image: unsplash("1593431763017-c689a61b729a", 900), imageFem: unsplash("1609899537878-88d5ba429bdb", 900) },
  suplementos: { description: "Whey, creatina, pré-treino e vitaminas pelo menor preço.", descriptionFem: "Whey, creatina, pré-treino e vitaminas pelo menor preço.", image: unsplash("1558017487-06bf9f82613a", 900), imageFem: unsplash("1558017487-06bf9f82613a", 900) },
};

export const departments: Department[] = taxonomy.map((d) => ({ slug: d.slug, label: d.label, ...departmentPhotos[d.slug] }));

export const departmentBySlug = Object.fromEntries(departments.map((d) => [d.slug, d])) as Record<DepartmentSlug, Department>;

export { kindInfo, styles, taxonomy };

export const colors: { slug: ColorSlug; label: string; hex: string }[] = [
  { slug: "preto", label: "Preto", hex: "#111111" },
  { slug: "branco", label: "Branco", hex: "#ffffff" },
  { slug: "cinza", label: "Cinza", hex: "#9ca3af" },
  { slug: "azul", label: "Azul", hex: "#2563eb" },
  { slug: "vermelho", label: "Vermelho", hex: "#dc2626" },
  { slug: "verde", label: "Verde", hex: "#16a34a" },
  { slug: "amarelo", label: "Amarelo", hex: "#facc15" },
  { slug: "laranja", label: "Laranja", hex: "#f97316" },
  { slug: "rosa", label: "Rosa", hex: "#f472b6" },
  { slug: "roxo", label: "Roxo", hex: "#9333ea" },
  { slug: "bege", label: "Bege", hex: "#e7d3b5" },
  { slug: "marrom", label: "Marrom", hex: "#7c4a2d" },
  { slug: "colorido", label: "Colorido", hex: "conic-gradient(#f43f5e,#facc15,#22c55e,#3b82f6,#a855f7,#f43f5e)" },
];

/** "Compre por tipo" na home: atalhos para um grupo ou tipo dentro de um departamento. */
export interface Topic {
  label: string;
  description: string;
  image: string;
  href: string;
  department: DepartmentSlug;
  group?: GroupSlug;
  kinds?: KindSlug[];
}

export const topics: Topic[] = [
  { label: "Tênis", description: "Corrida, academia, quadra e casual com preço de outlet.", image: unsplash("1542291026-7eec264c27ff", 800), href: "/calcados?grupo=tenis", department: "calcados", group: "tenis" },
  { label: "Raquetes", description: "Tênis, beach tennis, padel e tênis de mesa.", image: unsplash("1554068865-24cecd4e34b8", 800), href: "/equipamentos?grupo=raquetes", department: "equipamentos", group: "raquetes" },
  { label: "Camisetas e blusas", description: "Dry-fit, regatas, manga longa, compressão e polo.", image: unsplash("1521572163474-6864f9cf17ab", 800), href: "/roupas?grupo=parte-de-cima", department: "roupas", group: "parte-de-cima" },
  { label: "Lesão e recuperação", description: "Joelheiras, bolsas de gelo, rolos e compressão.", image: unsplash("1593431763017-c689a61b729a", 800), href: "/lesao-e-recuperacao", department: "lesao-e-recuperacao" },
  { label: "Chuteiras", description: "Campo, society e futsal das marcas dos profissionais.", image: unsplash("1529900748604-07564a03e7a6", 800), href: "/calcados?grupo=chuteiras", department: "calcados", group: "chuteiras" },
  { label: "Shorts, calças e leggings", description: "Leves para correr, de compressão para treinar e joggers.", image: unsplash("1554139844-af2fc8ad3a3a", 800), href: "/roupas?grupo=parte-de-baixo", department: "roupas", group: "parte-de-baixo" },
  { label: "Musculação", description: "Halteres, elásticos, tapetes e acessórios de treino.", image: unsplash("1517836357463-d25dfeac3438", 800), href: "/equipamentos?grupo=musculacao", department: "equipamentos", group: "musculacao" },
  { label: "Acessórios", description: "Bonés, óculos, mochilas, garrafas e relógios.", image: unsplash("1616066753769-b46d9d825331", 800), href: "/acessorios", department: "acessorios" },
];

export const topicsFem: Topic[] = [
  { label: "Leggings", description: "Que não ficam transparentes no agachamento.", image: unsplash("1518611012118-696072aa579a", 800), href: "/roupas?tipo=legging", department: "roupas", kinds: ["legging"] },
  { label: "Tops", description: "Sustentação para cada tipo de treino.", image: unsplash("1541534741688-6078c6bfb5c5", 800), href: "/roupas?tipo=top", department: "roupas", kinds: ["top"] },
  { label: "Tênis femininos", description: "Corrida, academia, quadra e casual.", image: unsplash("1560769629-975ec94e6a86", 800), href: "/calcados?grupo=tenis", department: "calcados", group: "tenis" },
  { label: "Shorts e saias", description: "Leves, com bermuda interna e bolso.", image: unsplash("1571019614242-c5c5dee9f50b", 800), href: "/roupas?grupo=parte-de-baixo", department: "roupas", kinds: ["shorts", "short-saia", "bermuda"] },
  { label: "Blusas e croppeds", description: "Regatas, croppeds, manga longa e dry-fit.", image: unsplash("1517438322307-e67111335449", 800), href: "/roupas?grupo=parte-de-cima", department: "roupas", kinds: ["camiseta", "regata", "cropped", "manga-longa", "compressao-cima"] },
  { label: "Conjuntos", description: "Top e legging combinando, prontos para o treino.", image: unsplash("1594381898411-846e7d193883", 800), href: "/roupas?grupo=conjuntos", department: "roupas", group: "conjuntos" },
  { label: "Raquetes", description: "Beach tennis, tênis e padel.", image: unsplash("1554068865-24cecd4e34b8", 800), href: "/equipamentos?grupo=raquetes", department: "equipamentos", group: "raquetes" },
  { label: "Lesão e recuperação", description: "Joelheiras, bolsas de gelo e massagem.", image: unsplash("1609899537878-88d5ba429bdb", 800), href: "/lesao-e-recuperacao", department: "lesao-e-recuperacao" },
  { label: "Acessórios para ela", description: "Bolsas, garrafas, faixas e relógios.", image: unsplash("1599058917212-d750089bc07e", 800), href: "/acessorios", department: "acessorios" },
];

export const topicsMasc: Topic[] = [
  { label: "Camisetas e regatas", description: "Dry-fit, regata cavada, manga longa e polo.", image: unsplash("1521572163474-6864f9cf17ab", 800), href: "/roupas?grupo=parte-de-cima", department: "roupas", kinds: ["camiseta", "regata", "manga-longa", "polo"] },
  { label: "Compressão", description: "Camisas segunda pele, bermudas e calças de compressão.", image: unsplash("1583454110551-21f2fa2afe61", 800), href: "/roupas?tipo=compressao-cima", department: "roupas", kinds: ["compressao-cima", "compressao-baixo"] },
  { label: "Bermudas e shorts", description: "Para correr, treinar e jogar.", image: unsplash("1554139844-af2fc8ad3a3a", 800), href: "/roupas?grupo=parte-de-baixo", department: "roupas", kinds: ["shorts", "bermuda"] },
  { label: "Tênis masculinos", description: "Corrida, academia, quadra e casual.", image: unsplash("1542291026-7eec264c27ff", 800), href: "/calcados?grupo=tenis", department: "calcados", group: "tenis" },
  { label: "Jaquetas e moletons", description: "Corta-vento, moletom e agasalho.", image: unsplash("1586791400644-b04429f7d808", 800), href: "/roupas?grupo=agasalhos", department: "roupas", group: "agasalhos" },
  { label: "Chuteiras", description: "Campo, society e futsal.", image: unsplash("1529900748604-07564a03e7a6", 800), href: "/calcados?grupo=chuteiras", department: "calcados", group: "chuteiras" },
  { label: "Musculação", description: "Halteres, elásticos e acessórios de treino.", image: unsplash("1517836357463-d25dfeac3438", 800), href: "/equipamentos?grupo=musculacao", department: "equipamentos", group: "musculacao" },
  { label: "Lesão e recuperação", description: "Joelheiras, bolsas de gelo e massagem.", image: unsplash("1593431763017-c689a61b729a", 800), href: "/lesao-e-recuperacao", department: "lesao-e-recuperacao" },
];

/** Textos da home em cada modo. */
export const homeCopy = {
  todos: { title: "Preço de atleta", text: "Descontos reais em tênis, chuteiras, suplementos e equipamentos, garimpados de hora em hora nas lojas que você já conhece.", heroAlt: "Atleta correndo na pista" },
  feminino: { title: "Feito pra ela", text: "Leggings, tops, croppeds, tênis e acessórios femininos, com as promoções primeiro, nas lojas que você já conhece.", heroAlt: "Mulher treinando em um tapete de yoga" },
  masculino: { title: "Feito pra ele", text: "Camisetas, bermudas, compressão, chuteiras, tênis e equipamentos masculinos, com as promoções primeiro.", heroAlt: "Homem treinando com barra na academia" },
} as const;

/** Faixas de preço usadas na home e no filtro de /ofertas (?preco=). */
export const priceRanges = [
  { slug: "ate-50", label: "Até R$ 50", min: 0, max: 50 },
  { slug: "ate-100", label: "Até R$ 100", min: 0, max: 100 },
  { slug: "ate-200", label: "Até R$ 200", min: 0, max: 200 },
  { slug: "acima-200", label: "Acima de R$ 200", min: 200, max: Infinity },
] as const;
export type PriceRangeSlug = (typeof priceRanges)[number]["slug"];

/** Fotos grandes da home. */
export const campaign = {
  hero: unsplash("1461896836934-ffe607ba8211", 2400),
  banner: unsplash("1526506118085-60ce8714f8c5", 2400),
};

/** Fotos da home no modo feminino. */
export const campaignFem = {
  hero: unsplash("1518611012118-696072aa579a", 2400),
  banner: unsplash("1574680096145-d05b474e2155", 2400),
};

/** Fotos da home no modo masculino. */
export const campaignMasc = {
  hero: unsplash("1581009146145-b5ef050c2e1e", 2400),
  banner: unsplash("1571019613454-1cb2f99b2d8b", 2400),
};

export const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c])) as Record<CategorySlug, Category>;

/**
 * Logos em public/lojas/ (versão de teste, baixados do Wikimedia Commons). Ao ser aprovado em cada
 * programa de afiliados, substitua o arquivo pelo logo oficial do painel da loja e siga as regras de marca dela.
 */
export const stores: Record<StoreId, { name: string; color: string; logo?: string }> = {
  mercadolivre: { name: "Mercado Livre", color: "#FFE600", logo: "/lojas/mercadolivre.svg" },
  amazon: { name: "Amazon", color: "#FF9900", logo: "/lojas/amazon.svg" },
  shopee: { name: "Shopee", color: "#EE4D2D", logo: "/lojas/shopee.svg" },
  netshoes: { name: "Netshoes", color: "#7B2CBF", logo: "/lojas/netshoes.svg" },
  centauro: { name: "Centauro", color: "#E30613", logo: "/lojas/centauro.svg" },
  decathlon: { name: "Decathlon", color: "#3643BA", logo: "/lojas/decathlon.svg" },
  magalu: { name: "Magalu", color: "#0086FF", logo: "/lojas/magalu.svg" },
};

/** Tag de associado da Amazon (pública: vai em todo link). */
export const AMAZON_TAG = "simpleathleti-20";

/**
 * Link para a busca da Amazon com a nossa tag. Enquanto a Creators API não é liberada, é assim que
 * a Amazon aparece no site: sem preço, só o atalho para a busca (permitido pelo programa de associados).
 */
export const amazonSearchUrl = (termo: string) =>
  `https://www.amazon.com.br/s?${new URLSearchParams({ k: termo, i: "sporting", tag: AMAZON_TAG })}`;

/** Link do canal de ofertas. Troque quando criar o canal. */
export const TELEGRAM_URL = "https://t.me/";

/** Slide do carrossel da home. */
export interface HeroSlide {
  /**
   * "diagonal": duas fotos cortadas pelas listras da marca + painel de texto; "foto": uma foto cheia;
   * "ofertas": os produtos de maior desconto do site, com foto, preço e loja reais.
   */
  layout: "diagonal" | "foto" | "ofertas";
  photos: string[];
  alt: string;
  /** Cor do painel de texto no layout diagonal. */
  panel?: "ink" | "hot" | "snow";
  /** Texto pequeno acima do título; "desconto" mostra "Até -X% hoje" com o maior desconto do momento. */
  eyebrow: string;
  title: string;
  text: string;
  /** `mode` troca o catálogo (Feminino/Masculino) em vez de abrir um link. */
  ctas: { label: string; href?: string; mode?: "feminino" | "masculino" }[];
}

const foto = (id: string) => unsplash(id, 1600);
const fotos = {
  elaLaranja: foto("1571019613454-1cb2f99b2d8b"),
  eleAcademia: foto("1581009146145-b5ef050c2e1e"),
  elaEEle: foto("1571019614242-c5c5dee9f50b"),
  corrida: foto("1590333748338-d629e4564ad9"),
  futebol: foto("1574629810360-7efbbe195018"),
  luta: foto("1517438322307-e67111335449"),
  elaTop: foto("1594381898411-846e7d193883"),
  eleHalter: foto("1583454110551-21f2fa2afe61"),
  elaBarra: foto("1541534741688-6078c6bfb5c5"),
  elaAgachamento: foto("1574680096145-d05b474e2155"),
  elaTapete: foto("1518611012118-696072aa579a"),
  eleCostas: foto("1526506118085-60ce8714f8c5"),
};

const slidePreco = (photos: string[]): HeroSlide => ({
  layout: "diagonal",
  photos,
  alt: "Atletas correndo e jogando futebol",
  panel: "hot",
  eyebrow: "desconto",
  title: "Preço de atleta",
  text: "Tênis, chuteiras, roupas e suplementos com desconto conferido de hora em hora. Se o preço não caiu de verdade, não entra.",
  ctas: [{ label: "Maiores descontos", href: "/ofertas?ordem=desconto" }],
});

/** Entra como 2º slide em todos os modos, quando há ofertas com desconto. */
export const slideOfertas: HeroSlide = {
  layout: "ofertas",
  photos: [],
  alt: "Produtos com os maiores descontos de agora",
  eyebrow: "Ofertas reais de agora",
  title: "Achados do dia",
  text: "Preço e desconto conferidos pelo robô direto na loja. Clique e compre na loja oficial.",
  ctas: [{ label: "Ver todas as ofertas", href: "/ofertas" }],
};

const slideCanal = (photo: string): HeroSlide => ({
  layout: "foto",
  photos: [photo],
  alt: "Pessoas treinando na academia",
  eyebrow: "Alerta de queda de preço",
  title: "O preço caiu? Você sabe primeiro",
  text: "Entre no canal grátis e receba as melhores quedas antes de todo mundo. Sem spam.",
  ctas: [{ label: "Entrar no canal", href: TELEGRAM_URL }],
});

/** Carrossel da home em cada modo. */
export const heroSlides: Record<"todos" | "feminino" | "masculino", HeroSlide[]> = {
  todos: [
    {
      layout: "diagonal",
      photos: [fotos.elaLaranja, fotos.eleAcademia],
      alt: "Uma mulher e um homem treinando",
      panel: "ink",
      eyebrow: "Simple Athletic",
      title: "Coisa boa é pra todo mundo",
      text: "Garimpamos promoção de verdade nas maiores lojas de esporte do Brasil. Pra ela, pra ele, pra você.",
      ctas: [{ label: "Ver ofertas", href: "/ofertas" }, { label: "Como funciona", href: "#como-funciona" }],
    },
    {
      layout: "foto",
      photos: [fotos.elaEEle],
      alt: "Mulher e homem treinando juntos na academia",
      eyebrow: "Duas listras, lado a lado",
      title: "Ela e ele no mesmo time",
      text: "Nenhuma listra na frente da outra. Escolha o seu lado do catálogo ou veja tudo junto.",
      ctas: [{ label: "Pra ela", mode: "feminino" }, { label: "Pra ele", mode: "masculino" }],
    },
    slidePreco([fotos.corrida, fotos.futebol]),
    {
      layout: "diagonal",
      photos: [fotos.elaTop, fotos.eleHalter],
      alt: "Mulher e homem treinando força",
      panel: "snow",
      eyebrow: "Do halter ao top",
      title: "Treino bom não é luxo",
      text: "Equipamento, roupa e suplemento de qualidade, sem pagar caro. Você compra direto na loja oficial.",
      ctas: [{ label: "Equipamentos", href: "/equipamentos" }, { label: "Roupas", href: "/roupas" }],
    },
    slideCanal(fotos.luta),
  ],
  feminino: [
    {
      layout: "diagonal",
      photos: [fotos.elaBarra, fotos.elaTop],
      alt: "Mulheres treinando força",
      panel: "ink",
      eyebrow: "Simple Athletic pra ela",
      title: "Força tem muitas formas",
      text: "Leggings, tops, tênis e acessórios com desconto de verdade. Treinar bem não é luxo.",
      ctas: [{ label: "Ver ofertas", href: "/ofertas" }, { label: "Roupas", href: "/roupas" }],
    },
    {
      layout: "foto",
      photos: [fotos.elaTapete],
      alt: "Mulheres treinando no tapete",
      eyebrow: "No seu ritmo",
      title: "Do tapete à pista",
      text: "Conjuntos, tops e tênis femininos, com as promoções primeiro.",
      ctas: [{ label: "Calçados", href: "/calcados" }, { label: "Acessórios", href: "/acessorios" }],
    },
    slidePreco([fotos.elaAgachamento, fotos.corrida]),
    slideCanal(fotos.elaLaranja),
  ],
  masculino: [
    {
      layout: "diagonal",
      photos: [fotos.eleAcademia, fotos.eleCostas],
      alt: "Homens treinando na academia",
      panel: "ink",
      eyebrow: "Simple Athletic pra ele",
      title: "Cada quilo conta. Cada real também",
      text: "Camisetas, bermudas, tênis e equipamentos masculinos, com desconto conferido.",
      ctas: [{ label: "Ver ofertas", href: "/ofertas" }, { label: "Calçados", href: "/calcados" }],
    },
    {
      layout: "foto",
      photos: [fotos.eleHalter],
      alt: "Homem treinando com halteres",
      eyebrow: "Treino pesado",
      title: "Preço leve",
      text: "Halteres, luvas, compressão e suplementos pelo menor preço que o robô encontrou.",
      ctas: [{ label: "Equipamentos", href: "/equipamentos" }, { label: "Suplementos", href: "/suplementos" }],
    },
    slidePreco([fotos.corrida, fotos.futebol]),
    slideCanal(fotos.luta),
  ],
};
