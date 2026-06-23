"use client";

import { useCallback, useEffect, useState } from "react";
import SummaryCards from "@/components/investments/SummaryCards";
import PendingSnapshotBanner from "@/components/investments/PendingSnapshotBanner";
import TransactionsCard from "@/components/investments/TransactionsCard";
import UpdateBalanceCard from "@/components/investments/UpdateBalanceCard";
import YieldChart from "@/components/investments/YieldChart";
import {
  fetchInvestmentsSummary,
  fetchYieldHistory,
  fetchInvestmentTransactions,
} from "@/lib/api";
import { INVESTMENTS } from "@/constants/test-ids";
import { InvestmentsSummary, MonthlyYield, InvestmentTransaction } from "@/dtos/investment";

export default function InvestmentsPage() {
  const [summary, setSummary] = useState<InvestmentsSummary | null>(null);
  const [yieldHistory, setYieldHistory] = useState<MonthlyYield[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [forceOpenBalance, setForceOpenBalance] = useState(false);

  const refresh = useCallback(async () => {
    const [s, y, t] = await Promise.all([
      fetchInvestmentsSummary(),
      fetchYieldHistory(),
      fetchInvestmentTransactions(),
    ]);
    setSummary(s);
    setYieldHistory(y);
    setTransactions(t);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div data-testid={INVESTMENTS.root} className="space-y-6">
      <section className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          Seus investimentos.
        </h1>
        <p className="text-[#6B6A65] text-sm sm:text-base">
          Acompanhe o saldo no banco, o quanto foi investido e o rendimento mês a mês.
        </p>
      </section>

      {summary?.pendingSnapshot && (
        <PendingSnapshotBanner onUpdateClick={() => setForceOpenBalance(true)} />
      )}

      <SummaryCards summary={summary} />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TransactionsCard transactions={transactions} onChanged={refresh} />
        </div>
        <UpdateBalanceCard
          pendingSnapshot={!!summary?.pendingSnapshot}
          forceOpen={forceOpenBalance}
          onOpenHandled={() => setForceOpenBalance(false)}
          onChanged={refresh}
        />
      </section>

      <YieldChart data={yieldHistory} />
    </div>
  );
}
