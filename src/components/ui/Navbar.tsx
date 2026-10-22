"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { categories, departmentBySlug, departmentLook, departments, TELEGRAM_URL } from "@/data/catalog";
import { groupsOf, type DepartmentSlug } from "@/data/taxonomy";
import type { Mode } from "@/lib/mode";
import { ChevronLeft, ChevronRight, CloseIcon, MenuIcon, SearchIcon } from "./Icons";
import ModeToggle from "./ModeToggle";

const shortLabels: Partial<Record<DepartmentSlug, string>> = { "lesao-e-recuperacao": "Recuperação" };

const links: { href: string; label: string; short?: string; dept?: DepartmentSlug }[] = [
  { href: "/ofertas", label: "Ofertas" },
  ...departments.map((d) => ({ href: `/${d.slug}`, label: d.label, short: shortLabels[d.slug], dept: d.slug })),
];

const messages = [
  { text: "Promoções primeiro: o que está com desconto aparece no topo de cada página.", cta: "Ver ofertas", href: "/ofertas" },
  { text: "Preços checados de hora em hora nas maiores lojas do Brasil.", cta: "Como funciona", href: "/#como-funciona" },
  { text: "Receba as quedas de preço antes de todo mundo.", cta: "Entrar no canal", href: TELEGRAM_URL },
];

export function Logo({ className = "", badge }: { className?: string; badge?: string }) {
  return (
    <Link href="/" aria-label="Simple Athletic, início" className={`flex items-center gap-2 whitespace-nowrap font-display text-[22px] uppercase leading-none tracking-tight ${className}`}>
      <span aria-hidden className="flex gap-[3px]">
        <span className="h-5 w-[5px] -skew-x-[18deg] bg-ink" />
        <span className="h-5 w-[5px] -skew-x-[18deg] bg-hot" />
      </span>
      <span className="hidden min-[380px]:inline">Simple Athletic</span>
      <span className="min-[380px]:hidden">SA</span>
      {badge && <span className="hidden font-sans text-xs font-semibold normal-case tracking-normal text-hot min-[420px]:inline">{badge}</span>}
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

export default function Navbar({ mode }: { mode: Mode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState<DepartmentSlug | null>(null);
  const [expanded, setExpanded] = useState<DepartmentSlug | null>(null);
  const megaDept = mega ? departmentBySlug[mega] : null;
  /** Fecha menus ao clicar em qualquer link dentro deles (inclusive links que só mudam o ?filtro). */
  const closeOnLink = (close: () => void) => (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) close();
  };

  useEffect(() => {
    setOpen(false);
    setMega(null);
  }, [pathname]);
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
          <Link href="/categorias" className="hover:text-muted">Esportes</Link>
          <span className="mx-3 h-3 w-px bg-ink" />
          <Link href="/#lojas" className="hover:text-muted">Lojas parceiras</Link>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white">
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto] items-center px-4 sm:px-6 lg:px-12 xl:grid-cols-[1fr_auto_1fr]">
          <Logo className="justify-self-start" badge={mode === "feminino" ? "Feminino" : mode === "masculino" ? "Masculino" : undefined} />

          <nav aria-label="Principal" className="hidden xl:block" onMouseLeave={() => setMega(null)} onClick={closeOnLink(() => setMega(null))}>
            <ul className="flex items-center gap-0.5">
              {links.map((l) => {
                const active = pathname === l.href || mega === l.dept;
                return (
                  <li key={l.href} onMouseEnter={() => setMega(l.dept ?? null)} onFocus={() => setMega(l.dept ?? null)}>
                    <Link
                      href={l.href}
                      aria-expanded={l.dept ? mega === l.dept : undefined}
                      className={`block whitespace-nowrap border-b-2 px-2 py-5 text-[15px] font-medium transition 2xl:px-3 2xl:text-base ${active ? "border-ink" : "border-transparent hover:border-ink"}`}
                    >
                      {l.short ?? l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Mega menu: colunas de grupos e tipos, como Nike e Centauro */}
            {megaDept && (
              <div className="absolute inset-x-0 top-full border-t border-line bg-white shadow-xl shadow-black/5">
                <div className="mx-auto flex max-w-[1440px] gap-12 px-12 pb-12 pt-8">
                  <div className="grid flex-1 grid-cols-4 gap-x-10 gap-y-8">
                    {groupsOf(megaDept.slug).map((g) => (
                      <div key={g.slug}>
                        <Link href={`/${megaDept.slug}?grupo=${g.slug}`} className="font-medium hover:text-muted">{g.label}</Link>
                        <ul className="mt-3 space-y-2 text-sm text-muted">
                          {g.kinds.map(([k, label]) => (
                            <li key={k}><Link href={`/${megaDept.slug}?tipo=${k}`} className="hover:text-ink">{label}</Link></li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <Link href={`/${megaDept.slug}`} className="group relative block aspect-[4/5] w-60 shrink-0 overflow-hidden bg-snow">
                    <Image src={departmentLook(megaDept, mode).image} alt="" fill sizes="240px" className="object-cover transition duration-700 group-hover:scale-105" />
                    <span className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-1.5 text-sm font-medium">Ver tudo em {megaDept.label}</span>
                  </Link>
                </div>
              </div>
            )}
          </nav>

          <div className="flex items-center justify-end gap-1">
            <ModeToggle mode={mode} compact className="mr-1 sm:mr-2" />
            <form action="/busca" role="search" className="relative hidden md:block">
              <label htmlFor="q" className="sr-only">Buscar ofertas</label>
              <SearchIcon className="pointer-events-none absolute left-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full p-2" />
              <input
                id="q"
                name="q"
                type="search"
                placeholder="Buscar"
                className="h-10 w-36 rounded-full bg-snow pl-11 pr-4 text-base outline-none transition placeholder:text-muted hover:bg-line focus:w-56 focus:bg-line"
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
        <aside onClick={closeOnLink(() => setOpen(false))} className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-white px-6 pb-8 pt-4 transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
          <div className="mb-6 flex justify-end">
            <button onClick={() => setOpen(false)} className="-mr-2 rounded-full p-2 hover:bg-snow" aria-label="Fechar menu" tabIndex={open ? 0 : -1}>
              <CloseIcon width={24} height={24} />
            </button>
          </div>
          <div className="mb-6 rounded-2xl bg-snow p-4">
            <ModeToggle mode={mode} />
            <p className="mt-2 text-sm text-muted">
              {mode === "feminino"
                ? "Mostrando só produtos femininos e acessórios para ela."
                : mode === "masculino"
                  ? "Mostrando só produtos masculinos e acessórios para ele."
                  : "Escolha Feminino ou Masculino para ver só produtos para você."}
            </p>
          </div>
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                {l.dept ? (
                  <>
                    <button
                      onClick={() => setExpanded(expanded === l.dept ? null : l.dept!)}
                      aria-expanded={expanded === l.dept}
                      tabIndex={open ? 0 : -1}
                      className="flex w-full items-center justify-between py-3 text-left text-2xl font-medium"
                    >
                      {l.label}
                      <ChevronRight width={22} height={22} className={`transition ${expanded === l.dept ? "rotate-90" : ""}`} />
                    </button>
                    {expanded === l.dept && (
                      <div className="mb-3 border-l-2 border-line pl-4">
                        <Link href={l.href} className="block py-2 font-medium underline underline-offset-4">Ver tudo em {l.label}</Link>
                        {groupsOf(l.dept).map((g) => (
                          <div key={g.slug} className="mt-3">
                            <Link href={`/${l.dept}?grupo=${g.slug}`} className="font-medium">{g.label}</Link>
                            <ul className="mt-1">
                              {g.kinds.map(([k, label]) => (
                                <li key={k}><Link href={`/${l.dept}?tipo=${k}`} className="block py-1.5 text-muted">{label}</Link></li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={l.href} tabIndex={open ? 0 : -1} className="flex items-center justify-between py-3 text-2xl font-medium">
                    {l.label} <ChevronRight width={22} height={22} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm font-medium text-muted">Por esporte</p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} tabIndex={open ? 0 : -1} className="block py-2 text-lg">{c.label}</Link>
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
