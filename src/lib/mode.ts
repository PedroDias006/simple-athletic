import { cookies } from "next/headers";

/** "feminino" quando a pessoa ligou o botão do modo feminino; o site inteiro muda de catálogo e de cor. */
export type Mode = "todos" | "feminino";

export const MODE_COOKIE = "modo";

export async function getMode(): Promise<Mode> {
  return (await cookies()).get(MODE_COOKIE)?.value === "feminino" ? "feminino" : "todos";
}
