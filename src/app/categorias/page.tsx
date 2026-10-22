import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import { CategoryTile, PageHeader } from "@/components/ui/Sections";
import { categories } from "@/data/catalog";

export const metadata: Metadata = { title: "Categorias" };

export default function CategoriesPage() {
  return (
    <Container>
      <PageHeader crumb="Esportes" title="Compre por esporte" />
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {categories.map((c) => <CategoryTile key={c.slug} category={c} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />)}
      </div>
    </Container>
  );
}
