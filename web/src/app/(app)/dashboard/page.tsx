"use client";

import { useCallback, useEffect, useState } from "react";
import MonthSelector from "@/components/dashboard/MonthSelector";
import BillingsCard from "@/components/dashboard/BillingsCard";
import ExpensesCard from "@/components/dashboard/ExpensesCard";
import SpendingChart from "@/components/dashboard/SpendingChart";
import { fetchBillings, fetchExpenses, fetchSummary, fetchCategories } from "@/lib/api";
import { DASHBOARD } from "@/constants/test-ids";
import { Expense } from "@/dtos/expense";
import { Summary } from "@/dtos/summary";

const getNextMonthYear = (year: number, month: number) =>
  month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

export default function Dashboard() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [billings, setBillings] = useState([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({} as Summary);
  const [previousSummary, setPreviousSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialPeriodResolved, setInitialPeriodResolved] = useState(false);
  const [firstYear, setFirstYear] = useState<number | undefined>(undefined);

  const getPreviousMonthYear = (y: number, m: number) =>
    m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 };

  useEffect(() => {
    let cancelled = false;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const resolveInitialPeriod = async () => {
      try {
        const currentExpenses: Expense[] = await fetchExpenses(currentYear, currentMonth);
        const allCurrentExpensesArePaid =
          currentExpenses.length > 0 &&
          currentExpenses.every((expense) => expense.status === "PAID");

        if (!cancelled && allCurrentExpensesArePaid) {
          const nextPeriod = getNextMonthYear(currentYear, currentMonth);
          setYear(nextPeriod.year);
          setMonth(nextPeriod.month);
        }
      } catch {
        if (!cancelled) {
          setYear(currentYear);
          setMonth(currentMonth);
        }
      } finally {
        if (!cancelled) {
          setInitialPeriodResolved(true);
        }
      }
    };

    resolveInitialPeriod();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
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

      if (e.length > 0) {
        setFirstYear((currentFirstYear) =>
          currentFirstYear ?? Math.min(year, new Date().getFullYear()),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    if (initialPeriodResolved) {
      refresh();
    }
  }, [initialPeriodResolved, refresh]);

  const refreshAfterChange = () => {
    setLoading(true);
    refresh();
  };

  return (
    <div data-testid={DASHBOARD.root}>
      <section className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Suas finanças, no controle.
          </h1>
          <p className="hidden sm:block text-[#6B6A65] text-sm sm:text-base">
            Acompanhe entradas, saídas e o quanto da sua renda está comprometida — mês a mês.
          </p>
        </div>
        <MonthSelector
          year={year}
          month={month}
          onChange={(y, m) => {
            if (y === year && m === month) return;
            setLoading(true);
            setYear(y);
            setMonth(m);
          }}
          loading={loading}
          firstYear={firstYear ?? today.getFullYear()}
        />
      </section>

      <section className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 items-start transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
        <BillingsCard billings={billings} year={year} month={month} onChanged={refreshAfterChange} summary={summary} previousSummary={previousSummary} categories={categories} />
        <ExpensesCard expenses={expenses} year={year} month={month} onChanged={refreshAfterChange} categories={categories} />
        <SpendingChart summary={summary} />
      </section>
    </div>
  );
}
