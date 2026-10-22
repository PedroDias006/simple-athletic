"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TELEGRAM_URL } from "@/data/catalog";
import { GridIcon, HomeIcon, SearchIcon, TagIcon, TelegramIcon } from "./Icons";

const tabs = [
  { href: "/", label: "Início", Icon: HomeIcon },
  { href: "/ofertas", label: "Ofertas", Icon: TagIcon },
  { href: "/categorias", label: "Categorias", Icon: GridIcon },
  { href: "/busca", label: "Buscar", Icon: SearchIcon },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegação rápida" className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${active ? "text-ink" : "text-gray-400"}`}>
                <Icon width={22} height={22} strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <a href={TELEGRAM_URL} target="_blank" rel="noopener" className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-sky-500">
            <TelegramIcon width={22} height={22} />
            Alertas
          </a>
        </li>
      </ul>
    </nav>
  );
}
