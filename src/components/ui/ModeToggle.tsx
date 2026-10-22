"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Mode } from "@/lib/mode";

/** Liga/desliga o modo feminino: guarda num cookie e recarrega o catálogo no servidor. */
export default function ModeToggle({ mode, className = "", compact = false }: { mode: Mode; className?: string; compact?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const on = mode === "feminino";

  const toggle = () => {
    const next: Mode = on ? "todos" : "feminino";
    document.cookie = next === "feminino" ? "modo=feminino; path=/; max-age=31536000; samesite=lax" : "modo=; path=/; max-age=0; samesite=lax";
    document.documentElement.dataset.modo = next; // a cor muda na hora, o catálogo chega em seguida
    start(() => router.refresh());
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      disabled={pending}
      title={on ? "Voltar para o catálogo completo" : "Ver só produtos femininos"}
      className={`group inline-flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium transition ${
        on ? "border-hot bg-hot text-white" : "border-line bg-white hover:border-ink"
      } ${pending ? "opacity-70" : ""} ${className}`}
    >
      <span className={`relative h-6 w-10 rounded-full transition ${on ? "bg-white/30" : "bg-line"}`}>
        <span className={`absolute top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] leading-none shadow transition-all ${on ? "left-[18px] text-hot" : "left-0.5 text-muted"}`}>♀</span>
      </span>
      {compact ? <span className="sr-only sm:not-sr-only">Feminino</span> : "Modo feminino"}
    </button>
  );
}
