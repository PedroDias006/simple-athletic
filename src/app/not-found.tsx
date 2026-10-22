import Link from "next/link";
import Container from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container className="py-28 text-center">
      <h1 className="font-display text-6xl uppercase leading-none sm:text-8xl">Bola fora</h1>
      <p className="mt-4 text-lg text-muted">Essa página não existe ou a oferta já acabou.</p>
      <Link href="/ofertas" className="mt-8 inline-block rounded-full bg-ink px-6 py-2.5 font-medium text-white hover:bg-black/70">Ver ofertas ativas</Link>
    </Container>
  );
}
