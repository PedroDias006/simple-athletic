"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import type { Mode } from "@/lib/mode";

const options: { mode: Mode; label: string; short: string; title: string }[] = [
  { mode: "todos", label: "Todos", short: "Todos", title: "Catálogo completo" },
  { mode: "feminino", label: "Feminino", short: "Fem", title: "Só produtos femininos, com o site em rosa" },
  { mode: "masculino", label: "Masculino", short: "Masc", title: "Só produtos masculinos, com o site em azul" },
];

/** Troca o modo: guarda num cookie, muda a cor na hora e recarrega o catálogo no servidor. */
export function useModeSwitch() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const choose = (next: Mode) => {
    document.cookie = next === "todos" ? "modo=; path=/; max-age=0; samesite=lax" : `modo=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.dataset.modo = next; // a cor muda na hora, o catálogo chega em seguida
    start(() => router.refresh());
  };
  return { pending, choose };
}

/** Botão que liga o modo (Feminino/Masculino) e já abre uma página do catálogo. */
export function ModeLinkButton({ mode, href, className, children }: { mode: Mode; href: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  const go = () => {
    document.cookie = mode === "todos" ? "modo=; path=/; max-age=0; samesite=lax" : `modo=${mode}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.dataset.modo = mode;
    router.push(href);
    router.refresh();
  };
  return <button type="button" onClick={go} className={className}>{children}</button>;
}

/** Cor da listra colorida de cada modo (a preta é sempre a mesma). */
const stripeColor: Record<Mode, string> = { todos: "#d43f21", feminino: "#e0457b", masculino: "#1d5fd1" };

const menuOptions: { mode: Mode; label: string; short: string; hint: string }[] = [
  { mode: "todos", label: "Todos", short: "Todos", hint: "Catálogo completo" },
  { mode: "feminino", label: "Pra ela", short: "Ela", hint: "Só produtos femininos" },
  { mode: "masculino", label: "Pra ele", short: "Ele", hint: "Só produtos masculinos" },
];

function ModeStripes({ mode, className = "h-4" }: { mode: Mode; className?: string }) {
  return (
    <span aria-hidden className={`flex shrink-0 gap-[3px] ${className}`}>
      <span className="w-[4px] -skew-x-[18deg] bg-[#111]" />
      <span className="w-[4px] -skew-x-[18deg] transition-colors" style={{ background: stripeColor[mode] }} />
    </span>
  );
}

/**
 * Seletor compacto do topo: um botão pequeno com as listras da marca (a colorida muda com o modo)
 * e o nome curto; ao clicar, abre um menu com Todos / Pra ela / Pra ele.
 */
export function ModeMenu({ mode, className = "" }: { mode: Mode; className?: string }) {
  const { pending, choose } = useModeSwitch();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = menuOptions.find((o) => o.mode === mode)!;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Catálogo: ${current.label}. Trocar`}
        className={`flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition hover:bg-snow ${open ? "bg-snow" : ""} ${pending ? "opacity-60" : ""}`}
      >
        <ModeStripes mode={mode} />
        <span>{current.short}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden className={`transition ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-line bg-white p-1.5 shadow-xl shadow-black/10">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Ver catálogo</p>
          {menuOptions.map((o) => {
            const active = o.mode === mode;
            return (
              <button
                key={o.mode}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => { setOpen(false); if (!active) choose(o.mode); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-snow ${active ? "bg-snow" : ""}`}
              >
                <ModeStripes mode={o.mode} className="h-6" />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{o.label}</span>
                  <span className="block text-xs text-muted">{o.hint}</span>
                </span>
                {active && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="m5 12 5 5 9-10" /></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Seletor Todos / Feminino / Masculino (versão larga, usada dentro do menu do celular). */
export default function ModeToggle({ mode, className = "", compact = false }: { mode: Mode; className?: string; compact?: boolean }) {
  const { pending, choose: switchTo } = useModeSwitch();
  const choose = (next: Mode) => next !== mode && switchTo(next);

  return (
    <div role="radiogroup" aria-label="Catálogo" className={`inline-flex shrink-0 rounded-full border border-line bg-white p-0.5 text-sm font-medium ${pending ? "opacity-70" : ""} ${className}`}>
      {options.map((o) => {
        const active = o.mode === mode;
        return (
          <button
            key={o.mode}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            disabled={pending}
            onClick={() => choose(o.mode)}
            className={`rounded-full px-2.5 py-1 transition sm:px-3 ${active ? "bg-hot text-white" : "text-muted hover:text-ink"} ${active && o.mode === "todos" ? "!bg-ink" : ""}`}
          >
            {compact ? (
              <>
                <span className="sm:hidden">{o.short}</span>
                <span className="hidden sm:inline">{o.label}</span>
              </>
            ) : (
              o.label
            )}
          </button>
        );
      })}
    </div>
  );
}
