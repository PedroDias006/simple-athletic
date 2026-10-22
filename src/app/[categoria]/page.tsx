import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import { EmptyState, FilterGroup, ListingLayout, PageHeader, ProductGrid } from "@/components/ui/Sections";
import { categories, categoryBySlug, TELEGRAM_URL } from "@/data/catalog";
import { getByCategory } from "@/lib/products";
import type { CategorySlug } from "@/types/product";

type Props = { params: Promise<{ categoria: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => categories.map((c) => ({ categoria: c.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = categoryBySlug[(await params).categoria as CategorySlug];
  return c ? { title: `Promoções de ${c.label}`, description: c.description } : {};
}

export default async function CategoryPage({ params }: Props) {
  const slug = (await params).categoria as CategorySlug;
  const category = categoryBySlug[slug];
  if (!category) notFound();
  const products = getByCategory(slug);

  return (
    <Container>
      <PageHeader crumb={category.label} title={`Promoções de ${category.label}`} count={products.length} description={category.description} />
      <ListingLayout
        filters={
          <FilterGroup
            title="Esportes"
            items={[
              { href: "/ofertas", label: "Todas as ofertas", active: false },
              ...categories.map((c) => ({ href: `/${c.slug}`, label: c.label, active: c.slug === slug })),
            ]}
          />
        }
      >
        {products.length ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState title="Nenhuma promoção ativa agora">
            Assim que um preço cair, avisamos no <a href={TELEGRAM_URL} target="_blank" rel="noopener" className="text-ink underline">canal do Telegram</a>.
          </EmptyState>
        )}
      </ListingLayout>
    </Container>
  );
}
