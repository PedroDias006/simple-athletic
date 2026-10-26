"use client";

import { useEffect } from "react";

/** Tempo da telinha antes de abrir a loja: dá para ler, sem atrasar a compra. */
export const ESPERA_MS = 1800;

/**
 * Abre a loja sozinho depois da telinha de passagem. `replace` para o "voltar" do celular
 * pular a telinha e cair de novo na página do produto.
 */
export default function Passagem({ destino }: { destino: string }) {
  useEffect(() => {
    const t = setTimeout(() => window.location.replace(destino), ESPERA_MS);
    return () => clearTimeout(t);
  }, [destino]);
  return (
    <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-line">
      <div className="hero-progress h-full origin-left bg-hot" style={{ animationDuration: `${ESPERA_MS}ms` }} />
    </div>
  );
}
