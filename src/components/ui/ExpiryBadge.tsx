"use client";

import { useEffect, useState } from "react";

/** Calculado no navegador para não ficar desatualizado entre um deploy e outro. */
export default function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const ms = Date.parse(expiresAt) - Date.now();
      if (ms <= 0) return setLabel("Encerrada");
      const h = Math.floor(ms / 3_600_000);
      if (h < 1) return setLabel(`Acaba em ${Math.max(1, Math.floor(ms / 60_000))} min`);
      if (h < 24) return setLabel(`Acaba em ${h}h`);
      const d = Math.floor(h / 24);
      setLabel(d === 1 ? "Acaba amanhã" : `Acaba em ${d} dias`);
    };
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [expiresAt]);

  if (!label) return null;
  const urgent = Date.parse(expiresAt) - Date.now() < 48 * 3_600_000;
  return <span className={urgent ? "text-hot" : "text-muted"}>{label}</span>;
}
