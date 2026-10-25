import { NextResponse } from "next/server";
import { getDetails } from "@/lib/details";
import { getProductById } from "@/lib/products";

// Todo clique em "Ver oferta" passa por aqui. Assim o bot pode trocar o link de
// afiliado sem quebrar posts antigos, e as visitas a /ir/* contam como cliques.
// Com ?tam=40, vai direto para a oferta daquele tamanho (a mesma do preço mostrado no site).
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return NextResponse.redirect(new URL("/", request.url));
  if (!product.active) return NextResponse.redirect(new URL(`/produto/${id}`, request.url));
  const tam = new URL(request.url).searchParams.get("tam");
  const tamanho = tam ? getDetails(id)?.sizes?.find((s) => s.label === tam && s.available && s.url) : undefined;
  return NextResponse.redirect(tamanho?.url ?? product.affiliateUrl, 302);
}
