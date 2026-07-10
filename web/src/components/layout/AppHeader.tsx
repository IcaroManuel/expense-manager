"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { NAV } from "@/constants/test-ids";
import { BarChart2, Wallet, LogOut, Moon, Sun } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Painel", testId: NAV.dashboardLink },
  { href: "/categories", label: "Categorias", testId: "nav-link-categories" },
  { href: "/analytics", label: "Análise", testId: "nav-link-analytics" },
];

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#1a1a1a]/85 backdrop-blur-xl border-b border-[#EAE7E1] dark:border-[#333]">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2D4238] dark:bg-[#4a7c4e] text-white flex items-center justify-center">
              <Wallet size={18} />
            </div>
            <div>
              <div className="text-eyebrow leading-none">Gestor Financeiro</div>
              <div className="font-display text-base font-semibold leading-tight dark:text-white">
                {"Painel mensal"}
              </div>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1 pl-4 border-l border-[#EAE7E1] dark:border-[#333]">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={link.testId}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#2D4238] dark:bg-[#4a7c4e] text-white"
                      : "text-[#6B6A65] dark:text-[#a0a0a0] hover:bg-[#F3F1ED] dark:hover:bg-[#2a2a2a] hover:text-[#1C1C19] dark:hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
          <div className="hidden md:block text-right min-w-0">
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
