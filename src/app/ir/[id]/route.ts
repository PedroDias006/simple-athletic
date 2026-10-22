import { NextResponse } from "next/server";
import { getProductById } from "@/lib/products";

// Todo clique em "Ver oferta" passa por aqui. Assim o bot pode trocar o link de
// afiliado sem quebrar posts antigos, e as visitas a /ir/* contam como cliques.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return NextResponse.redirect(new URL("/", request.url));
  if (!product.active) return NextResponse.redirect(new URL(`/${product.category}`, request.url));
  return NextResponse.redirect(product.affiliateUrl, 302);
}
