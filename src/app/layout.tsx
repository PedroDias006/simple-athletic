import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Container from "@/components/layout/Container";
import { categories, departments, TELEGRAM_URL } from "@/data/catalog";
import { getMode } from "@/lib/mode";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const anton = Anton({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-anton" });

export const metadata: Metadata = {
  title: { default: "SIMPLE ATHLETIC | Promoções de artigos esportivos", template: "%s | SIMPLE ATHLETIC" },
  description: "As melhores promoções de tênis, chuteiras, suplementos e equipamentos esportivos, garimpadas e atualizadas o dia todo.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

const footerCols = [
  {
    title: "Ofertas",
    links: [
      { href: "/ofertas", label: "Todas as ofertas" },
      { href: "/ofertas?ordem=desconto", label: "Maiores descontos" },
      { href: "/ofertas?ordem=menor", label: "Menores preços" },
      { href: "/ofertas?ordem=expira", label: "Acabando logo" },
    ],
  },
  { title: "Departamentos", links: departments.map((d) => ({ href: `/${d.slug}`, label: d.label })) },
  { title: "Esportes", links: categories.map((c) => ({ href: `/${c.slug}`, label: c.label })) },
  {
    title: "Simple Athletic",
    links: [
      { href: "/#como-funciona", label: "Como funciona" },
      { href: "/#lojas", label: "Lojas parceiras" },
      { href: TELEGRAM_URL, label: "Canal no Telegram" },
      { href: "/busca", label: "Buscar" },
    ],
  },
];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const mode = await getMode();
  return (
    <html lang="pt-BR" data-modo={mode} className={`${inter.variable} ${anton.variable}`} suppressHydrationWarning>
      <body className="bg-white font-sans text-ink antialiased">
        <a href="#conteudo" className="sr-only fixed left-4 top-4 z-[70] rounded bg-white p-3 text-black focus:not-sr-only">Pular para o conteúdo</a>
        <Navbar mode={mode} />
        <main id="conteudo" tabIndex={-1}>{children}</main>

        <footer className="mt-24 border-t border-line pb-10 pt-12">
          <Container>
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-[1fr_1fr_1fr_1fr_1.4fr]">
              {footerCols.map((col) => (
                <div key={col.title}>
                  <p className="font-medium">{col.title}</p>
                  <ul className="mt-5 space-y-3 text-sm text-muted">
                    {col.links.map((l) => (
                      <li key={l.href}>
                        {l.href.startsWith("http") ? (
                          <a href={l.href} target="_blank" rel="noopener" className="hover:text-ink">{l.label}</a>
                        ) : (
                          <Link href={l.href} className="hover:text-ink">{l.label}</Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                <p className="font-medium">Transparência</p>
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
                  Somos um site de afiliados: ao comprar pelos nossos links podemos receber uma comissão, sem custo extra para você.
                  Não vendemos produtos. Preços e estoque podem mudar a qualquer momento; confira sempre na loja.
                </p>
              </div>
            </div>
            <div className="mt-16 flex flex-col justify-between gap-2 text-xs text-muted sm:flex-row">
              <p>© {new Date().getFullYear()} Simple Athletic. Todos os direitos reservados.</p>
              <p>Brasil</p>
            </div>
          </Container>
        </footer>
      </body>
    </html>
  );
}
