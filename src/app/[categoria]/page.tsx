import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import { AmazonSearch, EmptyState, FilterGroup, ListingLayout, LoadMore, PageHeader, paginaAtual, POR_PAGINA, ProductGrid } from "@/components/ui/Sections";
import { categories, categoryBySlug, colors, departmentBySlug, departmentLook, departments, kindInfo, styles, TELEGRAM_URL } from "@/data/catalog";
import { groupsOf, infoOf } from "@/data/taxonomy";
import { getMode, modeLabel } from "@/lib/mode";
import { countBy, departmentOf, discountOf, filterProducts, getActiveProducts, groupOf, sortByDiscount } from "@/lib/products";
import type { CategorySlug, ColorSlug, DepartmentSlug, GroupSlug, KindSlug, StyleSlug } from "@/types/product";

/**
 * Uma rota para dois tipos de página:
 * - departamentos (/calcados, /roupas, /equipamentos, /lesao-e-recuperacao...) com grupo, tipo, estilo e cor;
 * - esportes (/futebol, /corrida...) com os mesmos filtros e mais o de departamento.
 */
type Params = { depto?: string; grupo?: string; tipo?: string; estilo?: string; cor?: string; ordem?: string; pagina?: string };
type Props = { params: Promise<{ categoria: string }>; searchParams: Promise<Params> };

export const dynamicParams = false;
export const generateStaticParams = () => [...departments.map((d) => d.slug), ...categories.map((c) => c.slug)].map((categoria) => ({ categoria }));

const orders = { desconto: "Maior desconto", menor: "Menor preço", maior: "Maior preço" } as const;
type Order = keyof typeof orders;
const keys = ["depto", "grupo", "tipo", "estilo", "cor", "ordem", "pagina"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).categoria;
  const d = departmentBySlug[slug as DepartmentSlug];
  if (d) return { title: `${d.label} esportivos com desconto`, description: d.description };
  const c = categoryBySlug[slug as CategorySlug];
  return c ? { title: `${c.label}: produtos e promoções`, description: c.description } : {};
}

export default async function ListingPage({ params, searchParams }: Props) {
  const slug = (await params).categoria;
  const sp = await searchParams;
  const mode = await getMode();
  const fem = mode === "feminino";
  const genderWord = mode === "todos" ? "" : modeLabel[mode];

  const department = departmentBySlug[slug as DepartmentSlug];
  const category = categoryBySlug[slug as CategorySlug];
  if (!department && !category) notFound();

  // Base da página, antes dos filtros escolhidos.
  const active = getActiveProducts(mode);
  const base = department ? filterProducts(active, { department: department.slug }) : active.filter((p) => p.category === category!.slug);

  // Cada filtro só vale se existir na lista anterior; assim um link velho nunca zera a página.
  const depto = !department && sp.depto && sp.depto in departmentBySlug ? (sp.depto as DepartmentSlug) : undefined;
  const l1 = filterProducts(base, { department: depto });
  const deptSlug = department?.slug ?? depto;
  const kindFromUrl = sp.tipo && sp.tipo in kindInfo ? (sp.tipo as Exclude<KindSlug, "outro">) : undefined;
  const group = (sp.grupo && l1.some((p) => groupOf(p) === sp.grupo) ? sp.grupo : kindFromUrl ? kindInfo[kindFromUrl].group : undefined) as GroupSlug | undefined;
  const l2 = filterProducts(l1, { group });
  const kind = kindFromUrl && l2.some((p) => p.kind === kindFromUrl) ? kindFromUrl : undefined;
  const l3 = filterProducts(l2, { kind });
  const style = sp.estilo && l3.some((p) => p.style === sp.estilo) ? (sp.estilo as StyleSlug) : undefined;
  const l4 = filterProducts(l3, { style });
  const color = sp.cor && colors.some((c) => c.slug === sp.cor) ? (sp.cor as ColorSlug) : undefined;
  const order: Order = sp.ordem && sp.ordem in orders ? (sp.ordem as Order) : "desconto";

  let list = filterProducts(l4, { color });
  list = order === "menor" ? [...list].sort((a, b) => a.price - b.price) : order === "maior" ? [...list].sort((a, b) => b.price - a.price) : sortByDiscount(list);
  const page = paginaAtual(sp.pagina);
  const shown = Math.min(list.length, page * POR_PAGINA);
  const promoCount = list.filter((p) => discountOf(p) > 0).length;

  // Contagens para mostrar só opções que têm oferta.
  const deptCounts = countBy(base, departmentOf);
  const groupCounts = countBy(l1, groupOf);
  const kindCounts = countBy(l2, (p) => p.kind);
  const styleCounts = countBy(l3, (p) => p.style ?? "sem-estilo");
  const colorCounts = countBy(l4, (p) => p.colors);

  const href = (next: Partial<Record<(typeof keys)[number], string | null>>) => {
    const cur: Params = { depto, grupo: group, tipo: kind, estilo: style, cor: color, ordem: order === "desconto" ? undefined : order };
    const q = new URLSearchParams();
    for (const key of keys) {
      const v = key in next ? next[key] : cur[key];
      if (v) q.set(key, v);
    }
    // Ao trocar um nível, os de baixo deixam de fazer sentido.
    if ("depto" in next) ["grupo", "tipo", "estilo"].forEach((k) => q.delete(k));
    if ("grupo" in next) ["tipo", "estilo"].forEach((k) => q.delete(k));
    const s = q.toString();
    return s ? `/${slug}?${s}` : `/${slug}`;
  };

  // Grupos e tipos na ordem da árvore do catálogo.
  const tree = groupsOf(deptSlug);
  const groupItems = tree.filter((g) => groupCounts.has(g.slug));
  const kindItems: KindSlug[] = (group ? tree.filter((g) => g.slug === group) : tree).flatMap((g) => g.kinds.map(([k]) => k)).filter((k) => kindCounts.has(k));
  if (kindCounts.has("outro")) kindItems.push("outro");

  const label = department?.label ?? category!.label;
  const suffix = genderWord ? ` · ${genderWord}` : "";
  const groupLabel = group && tree.find((g) => g.slug === group)?.label;
  const title = kind ? infoOf(kind).label + suffix : groupLabel ? groupLabel + suffix : `${label}${suffix}`;
  const description = kind || group ? undefined : department ? departmentLook(department, mode).description : category!.description;
  const crumb = [label, groupLabel, kind && infoOf(kind).label].filter(Boolean).join(" / ");
  /** O que buscar na Amazon: o nível mais específico que a pessoa escolheu. */
  const amazonTerm = kind ? infoOf(kind).label : groupLabel ?? label;

  return (
    <Container>
      <PageHeader crumb={crumb} title={title} count={list.length} description={description} />

      {/* Atalhos de grupo, como as abas das lojas oficiais */}
      {department && !group && groupItems.length > 1 && (
        <ul className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
          {groupItems.map((g) => (
            <li key={g.slug} className="shrink-0">
              <Link href={href({ grupo: g.slug })} className="flex items-baseline gap-2 rounded-full bg-snow px-5 py-2.5 font-medium transition hover:bg-line">
                {g.label} <span className="text-sm font-normal text-muted">{groupCounts.get(g.slug)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ListingLayout
        activeFilters={[depto, group, kind, style, color, order !== "desconto" ? order : undefined].filter(Boolean).length}
        filters={
          <>
            {department ? (
              <FilterGroup title="Departamentos" items={departments.map((d) => ({ href: `/${d.slug}`, label: d.label, active: d.slug === department.slug }))} />
            ) : (
              <FilterGroup
                title="Departamento"
                items={[
                  { href: href({ depto: null }), label: "Tudo", active: !depto },
                  ...departments.filter((d) => deptCounts.has(d.slug)).map((d) => ({ href: href({ depto: d.slug }), label: d.label, active: depto === d.slug, count: deptCounts.get(d.slug) })),
                ]}
              />
            )}
            <FilterGroup
              title="Categoria"
              items={[
                { href: href({ grupo: null }), label: "Tudo", active: !group },
                ...groupItems.map((g) => ({ href: href({ grupo: g.slug }), label: g.label, active: group === g.slug, count: groupCounts.get(g.slug) })),
              ]}
            />
            <FilterGroup
              title="Tipo"
              items={[
                { href: href({ tipo: null }), label: "Todos os tipos", active: !kind },
                ...kindItems.map((k) => ({ href: href({ tipo: k }), label: infoOf(k).label, active: kind === k, count: kindCounts.get(k) })),
              ]}
            />
            <FilterGroup
              title="Estilo"
              items={[
                { href: href({ estilo: null }), label: "Todos os estilos", active: !style },
                ...styles.filter((s) => styleCounts.has(s.slug)).map((s) => ({ href: href({ estilo: s.slug }), label: s.label, active: style === s.slug, count: styleCounts.get(s.slug) })),
              ]}
            />
            <FilterGroup
              title="Cor"
              items={[
                { href: href({ cor: null }), label: "Todas as cores", active: !color },
                ...colors.filter((c) => colorCounts.has(c.slug)).map((c) => ({ href: href({ cor: c.slug }), label: c.label, swatch: c.hex, active: color === c.slug, count: colorCounts.get(c.slug) })),
              ]}
            />
            <FilterGroup title="Ordenar por" items={(Object.keys(orders) as Order[]).map((o) => ({ href: href({ ordem: o === "desconto" ? null : o }), label: orders[o], active: o === order }))} />
          </>
        }
      >
        {list.length ? (
          <>
            {promoCount > 0 && <p className="mb-4 text-sm text-muted">{promoCount} em promoção, mostradas primeiro</p>}
            <ProductGrid products={list.slice(0, shown)} />
            <LoadMore shown={shown} total={list.length} href={href({ pagina: String(page + 1) })} />
          </>
        ) : (
          <EmptyState title={genderWord ? `Nenhum produto ${fem ? "feminino" : "masculino"} aqui agora` : "Nenhum produto aqui agora"}>
            {genderWord ? `O robô procura novas ofertas ${fem ? "femininas" : "masculinas"} de hora em hora. ` : ""}
            Assim que um preço cair, avisamos no <a href={TELEGRAM_URL} target="_blank" rel="noopener" className="text-ink underline">canal do Telegram</a>.
          </EmptyState>
        )}
        <AmazonSearch term={`${amazonTerm}${genderWord ? ` ${genderWord.toLowerCase()}` : ""}`} label={amazonTerm.toLowerCase()} />
      </ListingLayout>
    </Container>
  );
}
