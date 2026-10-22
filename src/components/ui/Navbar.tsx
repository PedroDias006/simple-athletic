"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { categories, TELEGRAM_URL } from "@/data/catalog";
import { ChevronLeft, ChevronRight, CloseIcon, MenuIcon, SearchIcon } from "./Icons";

const links = [{ href: "/ofertas", label: "Ofertas" }, ...categories.map((c) => ({ href: `/${c.slug}`, label: c.label }))];

const messages = [
  { text: "Desconto real de no mínimo 15%. Se não for, não entra.", cta: "Ver ofertas", href: "/ofertas" },
  { text: "Preços checados de hora em hora nas maiores lojas do Brasil.", cta: "Como funciona", href: "/#como-funciona" },
  { text: "Receba as quedas de preço antes de todo mundo.", cta: "Entrar no canal", href: TELEGRAM_URL },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Simple Athletic, início" className={`flex items-center gap-2 font-display text-[22px] uppercase leading-none tracking-tight ${className}`}>
      <span aria-hidden className="flex gap-[3px]">
        <span className="h-5 w-[5px] -skew-x-[18deg] bg-ink" />
        <span className="h-5 w-[5px] -skew-x-[18deg] bg-hot" />
      </span>
      Simple Athletic
    </Link>
  );
}

function PromoStrip() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 6000);
    return () => clearInterval(t);
  }, []);
  const m = messages[i];
  const external = m.href.startsWith("http");
  const go = (d: number) => setI((n) => (n + d + messages.length) % messages.length);

  return (
    <div className="bg-snow">
      <div className="mx-auto flex h-12 max-w-3xl items-center justify-between gap-2 px-2">
        <button onClick={() => go(-1)} aria-label="Mensagem anterior" className="rounded-full p-2 hover:bg-line"><ChevronLeft width={18} height={18} /></button>
        <p className="line-clamp-2 text-center text-[13px] leading-snug sm:text-sm" aria-live="polite">
          {m.text}{" "}
          <a href={m.href} {...(external ? { target: "_blank", rel: "noopener" } : {})} className="font-medium underline underline-offset-2">{m.cta}</a>
        </p>
        <button onClick={() => go(1)} aria-label="Próxima mensagem" className="rounded-full p-2 hover:bg-line"><ChevronRight width={18} height={18} /></button>
      </div>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      {/* Barra utilitária */}
      <div className="hidden bg-snow lg:block">
        <div className="mx-auto flex h-9 max-w-[1440px] items-center justify-end px-12 text-xs font-medium">
          <a href={TELEGRAM_URL} target="_blank" rel="noopener" className="hover:text-muted">Alertas no Telegram</a>
          <span className="mx-3 h-3 w-px bg-ink" />
          <Link href="/categorias" className="hover:text-muted">Categorias</Link>
          <span className="mx-3 h-3 w-px bg-ink" />
          <Link href="/#lojas" className="hover:text-muted">Lojas parceiras</Link>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white">
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto] items-center px-4 sm:px-6 lg:px-12 xl:grid-cols-[1fr_auto_1fr]">
          <Logo className="justify-self-start" />

          <nav aria-label="Principal" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={`block border-b-2 px-3 py-5 text-base font-medium transition ${active ? "border-ink" : "border-transparent hover:border-ink"}`}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-1">
            <form action="/busca" role="search" className="relative hidden md:block">
              <label htmlFor="q" className="sr-only">Buscar ofertas</label>
              <SearchIcon className="pointer-events-none absolute left-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full p-2" />
              <input
                id="q"
                name="q"
                type="search"
                placeholder="Buscar"
                className="h-10 w-44 rounded-full bg-snow pl-11 pr-4 text-base outline-none transition placeholder:text-muted hover:bg-line focus:w-64 focus:bg-line"
              />
            </form>
            <Link href="/busca" aria-label="Buscar" className="rounded-full p-2 hover:bg-snow md:hidden">
              <SearchIcon width={24} height={24} />
            </Link>
            <button onClick={() => setOpen(true)} className="rounded-full p-2 hover:bg-snow xl:hidden" aria-label="Abrir menu">
              <MenuIcon width={24} height={24} />
            </button>
          </div>
        </div>
      </header>

      <PromoStrip />

      {/* Menu do celular */}
      <div className={`fixed inset-0 z-[60] xl:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-white px-6 pb-8 pt-4 transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
          <div className="mb-6 flex justify-end">
            <button onClick={() => setOpen(false)} className="-mr-2 rounded-full p-2 hover:bg-snow" aria-label="Fechar menu" tabIndex={open ? 0 : -1}>
              <CloseIcon width={24} height={24} />
            </button>
          </div>
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} tabIndex={open ? 0 : -1} className="flex items-center justify-between py-3 text-2xl font-medium">
                  {l.label} <ChevronRight width={22} height={22} />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-10 max-w-xs text-lg font-medium leading-snug text-muted">
            Receba as quedas de preço antes de todo mundo. Grátis.
          </p>
          <a href={TELEGRAM_URL} target="_blank" rel="noopener" tabIndex={open ? 0 : -1} className="mt-5 inline-flex w-fit rounded-full bg-ink px-6 py-3 font-medium text-white hover:bg-black/70">
            Entrar no canal
          </a>
        </aside>
      </div>
    </>
  );
}
