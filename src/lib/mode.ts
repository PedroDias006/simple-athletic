import { cookies } from "next/headers";

/**
 * Modo do site, escolhido no botão do topo e guardado num cookie: o catálogo inteiro e as cores mudam.
 * "feminino" = fundo rosa e só itens para ela; "masculino" = tons azulados e só itens para ele.
 */
export type Mode = "todos" | "feminino" | "masculino";

export const MODE_COOKIE = "modo";

export const modeLabel: Record<Mode, string> = { todos: "Todos", feminino: "Feminino", masculino: "Masculino" };

export function parseMode(value: string | undefined): Mode {
  return value === "feminino" || value === "masculino" ? value : "todos";
}

export async function getMode(): Promise<Mode> {
  return parseMode((await cookies()).get(MODE_COOKIE)?.value);
}
