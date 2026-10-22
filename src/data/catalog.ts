import type { CategorySlug, StoreId } from "@/types/product";

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

/** Tipos de produto ("Compre por tipo"). Cada um abre /busca?tipo=slug com as ofertas que batem com algum dos termos. */
export interface Topic {
  slug: string;
  label: string;
  description: string;
  image: string;
  terms: string[];
  /** Categorias que não entram (ex.: "tênis" não deve trazer raquete de tênis). */
  excludeCategories?: CategorySlug[];
}

export const topics: Topic[] = [
  { slug: "camisetas", label: "Camisetas e blusas", description: "Dry-fit para treinar, camisas de time e básicas para o dia a dia.", image: unsplash("1521572163474-6864f9cf17ab", 800), terms: ["camiseta", "blusa", "camisa", "regata", "cropped"] },
  { slug: "shorts", label: "Shorts e bermudas", description: "Leves para correr, de compressão para treinar e bermudas para o fim de semana.", image: unsplash("1554139844-af2fc8ad3a3a", 800), terms: ["short", "bermuda"] },
  { slug: "tenis", label: "Tênis", description: "Corrida, academia e casual: os modelos mais procurados com preço de outlet.", image: unsplash("1542291026-7eec264c27ff", 800), terms: ["tênis"], excludeCategories: ["raquetes"] },
  { slug: "chuteiras", label: "Chuteiras", description: "Campo, society e futsal das marcas que os jogadores profissionais usam.", image: unsplash("1529900748604-07564a03e7a6", 800), terms: ["chuteira"] },
  { slug: "moletons", label: "Moletons e jaquetas", description: "Corta-vento, moletom e jaqueta para treinar no frio ou sair de casa.", image: unsplash("1586791400644-b04429f7d808", 800), terms: ["moletom", "jaqueta", "corta-vento", "casaco", "agasalho"] },
  { slug: "calcas", label: "Calças e leggings", description: "Leggings que não ficam transparentes, calças de moletom e joggers.", image: unsplash("1584863495140-a320b13a11a8", 800), terms: ["calça", "legging", "jogger"] },
  { slug: "acessorios", label: "Acessórios", description: "Mochilas, bonés, meias, garrafas e relógios para completar o treino.", image: unsplash("1616066753769-b46d9d825331", 800), terms: ["mochila", "boné", "meia", "garrafa", "squeeze", "relógio", "viseira", "bolsa", "munhequeira"] },
];

export const topicBySlug = Object.fromEntries(topics.map((t) => [t.slug, t])) as Record<string, Topic | undefined>;

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

/** Link do canal de ofertas. Troque quando criar o canal. */
export const TELEGRAM_URL = "https://t.me/";
