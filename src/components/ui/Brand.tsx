import type { ReactNode } from "react";

/**
 * As duas listras da marca: preta e laranja, do mesmo tamanho, inclinadas pra frente.
 * Uma por ela, outra por ele. No modo feminino a laranja vira rosa; no masculino, azul.
 * `a` e `b` trocam as cores quando o fundo já é escuro ou laranja.
 */
export function Stripes({ className = "h-5", a = "bg-ink", b = "bg-hot" }: { className?: string; a?: string; b?: string }) {
  return (
    <span aria-hidden className={`inline-flex shrink-0 gap-[0.18em] ${className}`}>
      <span className={`h-full w-[0.28em] -skew-x-[18deg] ${a}`} />
      <span className={`h-full w-[0.28em] -skew-x-[18deg] ${b}`} />
    </span>
  );
}

/** Título de seção com as listras na frente. */
export function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`flex items-center gap-3 text-xl font-medium sm:text-2xl ${className}`}>
      <Stripes className="h-[0.9em]" />
      {children}
    </h2>
  );
}
