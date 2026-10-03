"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { NAV } from "@/constants/test-ids";
import { ChevronDown, Wallet, LogOut, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { href: "/dashboard", label: "Painel", testId: NAV.dashboardLink },
  { href: "/categories", label: "Categorias", testId: "nav-link-categories" },
  { href: "/analytics", label: "Análise", testId: "nav-link-analytics" },
];

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const pageTitle = pathname === "/dashboard"
    ? "Painel mensal"
    : NAV_LINKS.find((link) => link.href === pathname)?.label ?? "Painel mensal";

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#1a1a1a]/85 backdrop-blur-xl border-b border-[#EAE7E1] dark:border-[#333]">
      <div className="mx-auto px-3 sm:px-6 lg:px-8 min-h-16 flex items-center justify-between gap-2 py-2">
        <div className="flex min-w-0 items-center gap-3 lg:gap-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-9 h-9 shrink-0 rounded-xl bg-[#2D4238] dark:bg-[#4a7c4e] text-white items-center justify-center">
              <Wallet size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-eyebrow leading-none">Dividão</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    data-testid="nav-trigger"
                    aria-label={`Abrir navegação: ${pageTitle}`}
                    className="flex min-h-9 max-w-full items-center gap-1 rounded-md text-left font-display text-sm sm:text-base font-semibold leading-tight outline-none focus-visible:ring-2 focus-visible:ring-[#4a7c4e]"
                  >
                    <span className="truncate">{pageTitle}</span>
                    <ChevronDown size={16} className="shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={8} className="w-48 max-w-[calc(100vw-2rem)]" aria-label="Páginas">
                  {NAV_LINKS.map((link) => (
                    <DropdownMenuItem key={link.href} asChild className="min-h-11 px-3">
                      <Link
                        href={link.href}
                        data-testid={link.testId}
                        aria-current={pathname === link.href ? "page" : undefined}
                        className={pathname === link.href ? "bg-accent font-semibold" : ""}
                      >
                        {link.href === "/dashboard" ? "Painel mensal" : link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full border border-[#EAE7E1] flex items-center justify-center hover:bg-[#F3F1ED] text-[#6B6A65] transition-colors dark:border-[#333] dark:hover:bg-[#222]"
            aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
            title={theme === "light" ? "Modo escuro" : "Modo claro"}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {user?.picture ? (
            <img
              src={user.picture}
              alt={user?.name || "Usuário"}
              className="w-9 h-9 rounded-full object-cover border border-[#EAE7E1] dark:border-[#333]"
              data-testid="user-avatar"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#F3F1ED] flex items-center justify-center text-sm font-semibold text-[#2D4238] dark:bg-[#222] dark:text-white">
              {(user?.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden xl:block text-right min-w-0">
            <div
              data-testid="user-name"
              className="font-display text-sm font-semibold truncate max-w-[140px] dark:text-white"
            >
              {user?.name}
            </div>
            <div className="text-[11px] text-[#6B6A65] truncate max-w-[140px] dark:text-[#999]">
              {user?.email}
            </div>
          </div>
          <button
            data-testid="logout-btn"
            onClick={logout}
            className="w-9 h-9 rounded-full border border-[#EAE7E1] flex items-center justify-center hover:bg-[#F3F1ED] text-[#6B6A65] transition-colors dark:border-[#333] dark:hover:bg-[#222] dark:text-[#999]"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
