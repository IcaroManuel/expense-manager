"use client";

import { useCallback, useEffect, useState } from "react";
import MonthSelector from "@/components/dashboard/MonthSelector";
import BillingsCard from "@/components/dashboard/BillingsCard";
import ExpensesCard from "@/components/dashboard/ExpensesCard";
import SpendingChart from "@/components/dashboard/SpendingChart";
import SummaryCards from "@/components/dashboard/SummaryCards";
import { fetchBillings, fetchExpenses, fetchSummary, fetchCategories } from "@/lib/api";
import { DASHBOARD } from "@/constants/test-ids";
import { Summary } from "@/dtos/summary";

export default function Dashboard() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [billings, setBillings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState<Summary>({} as Summary);
  const [previousSummary, setPreviousSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firstYear, setFirstYear] = useState<number | undefined>(undefined);

  const getPreviousMonthYear = (y: number, m: number) =>
    m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 };

  const refresh = useCallback(async () => {
    setLoading(true);
    const prev = getPreviousMonthYear(year, month);
    try {
      const [b, e, s, ps, c] = await Promise.all([
        fetchBillings(year, month),
        fetchExpenses(year, month),
        fetchSummary(year, month),
        fetchSummary(prev.year, prev.month),
        fetchCategories(),
      ]);
      setBillings(b);
      setExpenses(e);
      setSummary(s);
      setPreviousSummary(ps);
      setCategories(c);

      if (firstYear === undefined && e.length > 0) {
        setFirstYear(year);
      }
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div data-testid={DASHBOARD.root}>
      <section className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Suas finanças, no controle.
          </h1>
          <p className="text-[#6B6A65] text-sm sm:text-base">
            Acompanhe entradas, saídas e o quanto da sua renda está comprometida — mês a mês.
          </p>
        </div>
        <MonthSelector
          year={year}
          month={month}
          onChange={(y, m) => { setYear(y); setMonth(m); }}
          loading={loading}
          firstYear={firstYear ?? today.getFullYear()}
        />
      </section>

      <section className={`grid grid-cols-1 lg:grid-cols-3 gap-6 items-start transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
        <BillingsCard billings={billings} year={year} month={month} onChanged={refresh} summary={summary} previousSummary={previousSummary} categories={categories} />
        <ExpensesCard expenses={expenses} year={year} month={month} onChanged={refresh} categories={categories} />
        <SpendingChart summary={summary} />
      </section>
    </div>
  );
}
