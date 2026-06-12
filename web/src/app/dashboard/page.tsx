"use client";

import React, { useCallback, useEffect, useState } from "react";
import { LogOut, Wallet } from "lucide-react";
import MonthSelector from "@/components/dashboard/MonthSelector";
import SummaryCards from "@/components/dashboard/SummaryCards";
import BillingsCard from "@/components/dashboard/BillingsCard";
import ExpensesCard from "@/components/dashboard/ExpensesCard";
import SpendingChart from "@/components/dashboard/SpendingChart";
import { fetchBillings, fetchExpenses, fetchSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { DASHBOARD } from "@/constants/test-ids";

export default function Dashboard() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [billings, setBillings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState<any>(null);
  const { user, logout } = useAuth();

  const refresh = useCallback(async () => {
    const [b, e, s] = await Promise.all([
      fetchBillings(year, month),
      fetchExpenses(year, month),
      fetchSummary(year, month),
    ]);
    setBillings(b);
    setExpenses(e);
    setSummary(s);
  }, [year, month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  return (
    <div data-testid={DASHBOARD.root} className="min-h-screen bg-[#F9F8F6] text-[#1C1C19]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#EAE7E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2D4238] text-white flex items-center justify-center">
              <Wallet size={18} />
            </div>
            <div>
              <div className="text-eyebrow leading-none">Gestor Financeiro</div>
              <div className="font-display text-base font-semibold leading-tight">
                Painel mensal
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <MonthSelector year={year} month={month} onChange={onMonthChange} />
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-[#EAE7E1]">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user?.name || "Usuário"}
                  className="w-9 h-9 rounded-full object-cover border border-[#EAE7E1]"
                  data-testid="user-avatar"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#F3F1ED] flex items-center justify-center text-sm font-semibold text-[#2D4238]">
                  {(user?.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-right min-w-0">
                <div
                  data-testid="user-name"
                  className="font-display text-sm font-semibold truncate max-w-[140px]"
                >
                  {user?.name}
                </div>
                <div className="text-[11px] text-[#6B6A65] truncate max-w-[140px]">
                  {user?.email}
                </div>
              </div>
              <button
                data-testid="logout-btn"
                onClick={logout}
                className="w-9 h-9 rounded-full border border-[#EAE7E1] flex items-center justify-center hover:bg-[#F3F1ED] text-[#6B6A65] transition-colors"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="space-y-2">
          <div className="text-eyebrow">Visão geral</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Suas finanças, no controle.
          </h1>
          <p className="text-[#6B6A65] max-w-xl text-sm sm:text-base">
            Acompanhe entradas, saídas e o quanto da sua renda está comprometida — mês a mês, com
            histórico permanente.
          </p>
        </section>

        <SummaryCards summary={summary} />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SpendingChart summary={summary} />
          </div>
          <div className="lg:col-span-1">
            <BillingsCard billings={billings} year={year} month={month} onChanged={refresh} />
          </div>
        </section>

        <section>
          <ExpensesCard expenses={expenses} year={year} month={month} onChanged={refresh} />
        </section>

        <footer className="text-center text-xs text-[#9A9892] py-6">
          Sincronizado · dados persistidos com ACID a nível de documento
        </footer>
      </main>
    </div>
  );
}
