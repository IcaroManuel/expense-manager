"use client";

import { useCallback, useEffect, useState } from "react";
import MonthSelector from "@/components/dashboard/MonthSelector";
import BillingsCard from "@/components/dashboard/BillingsCard";
import ExpensesCard from "@/components/dashboard/ExpensesCard";
import SpendingChart from "@/components/dashboard/SpendingChart";
import { fetchBillings, fetchExpenses, fetchSummary } from "@/lib/api";
import { DASHBOARD } from "@/constants/test-ids";

export default function Dashboard() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [billings, setBillings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState<any>(null);

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
    <div data-testid={DASHBOARD.root}>
      <section className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Suas finanças, no controle.
          </h1>
          <p className="text-[#6B6A65] text-sm sm:text-base">
            Acompanhe entradas, saídas e o quanto da sua renda está comprometida — mês a mês, com
            histórico permanente.
          </p>
        </div>
        <MonthSelector year={year} month={month} onChange={onMonthChange} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BillingsCard billings={billings} year={year} month={month} onChanged={refresh} summary={summary} />
        <ExpensesCard expenses={expenses} year={year} month={month} onChanged={refresh} />
        <SpendingChart summary={summary} />
      </section>
    </div>
  );
}
