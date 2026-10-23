"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
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

/** Seletor Todos / Feminino / Masculino. */
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
