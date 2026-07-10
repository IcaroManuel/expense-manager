import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatBRL, EXPENSE_COLOR_PALETTE } from "@/lib/format";
import { DASHBOARD } from "@/constants/test-ids";
import { fetchCategories } from "@/lib/api";

export interface ExpenseBucket {
  categoryId: string;
  categoryName: string;
  value: number | string;
  color: string;
}

export interface SummaryData {
  totalIncome?: number | string;
  expensesByCategory?: ExpenseBucket[];
}

export interface SpendingChartProps {
  summary?: SummaryData | null;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return (
    <div className={`${isDark ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-[#EAE7E1]"} border rounded-xl px-3 py-2 shadow-sm`}>
      <div className={`text-xs uppercase tracking-wider ${isDark ? "text-[#a0a0a0]" : "text-[#6B6A65]"}`}>{p.name}</div>
      <div className={`font-display font-semibold ${isDark ? "text-white" : "text-[#1C1C19]"}`}>{formatBRL(p.value)}</div>
      {p.payload.percent != null && (
        <div className={`text-xs mt-0.5 ${isDark ? "text-[#707070]" : "text-[#6B6A65]"}`}>
          {p.payload.percent.toFixed(1)}% da renda
        </div>
      )}
    </div>
  );
};

export default function SpendingChart({ summary }: SpendingChartProps) {
  if (!summary) return null;

  const income = Number(summary.totalIncome || 0);
  const buckets = summary.expensesByCategory || [];

  const data = buckets
    .map((b) => {
      const value = Number(b.value) || 0;
      return {
        categoryId: b.categoryId,
        name: b.categoryName,
        value,
        percent: income > 0 ? (value / income) * 100 : 0,
        color: b.color || EXPENSE_COLOR_PALETTE[0].value,
      };
    })
    .filter((d) => d.value > 0);

  const allZero = data.length === 0;
  const totalExpenses = data.reduce((a, d) => a + d.value, 0);

  return (
    <div
      data-testid={DASHBOARD.chart}
      className="bg-white dark:bg-[#1a1a1a] border border-[#EAE7E1] dark:border-[#333] rounded-2xl p-4 sm:p-6 flex flex-col transition-colors"
    >
      <div className="mb-4">
        <div className="text-eyebrow dark:text-[#a0a0a0]">Análise</div>
        <h2 className="font-display text-xl sm:text-2xl font-semibold mt-1 tracking-tight dark:text-white">
          Gastos por categoria
        </h2>
        <div className="text-sm text-[#6B6A65] dark:text-[#a0a0a0] mt-1">Distribuição das saídas do mês.</div>
      </div>

      {allZero ? (
        <div className="flex items-center justify-center text-sm text-[#9A9892] dark:text-[#707070] py-16">
          Nenhuma despesa neste mês.
        </div>
      ) : (
        <>
          <div className="relative h-[200px] sm:h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="80%"
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={3}
                >
                  {data.map((entry) => (
                    <Cell key={entry.categoryId} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
              <span className="text-[10px] uppercase tracking-widest text-[#9A9892] dark:text-[#707070]">Total</span>
              <span className="font-display font-bold text-base sm:text-lg text-[#1C1C19] dark:text-white tabular-nums">
                {formatBRL(totalExpenses)}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {data.map((d) => {
              const barWidth = totalExpenses > 0 ? (d.value / totalExpenses) * 100 : 0;
              return (
                <div
                  key={d.categoryId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#F9F8F6] dark:bg-[#2a2a2a] border border-[#EAE7E1] dark:border-[#333] transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: d.color }}
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[#1C1C19] dark:text-white truncate">
                        {d.name}
                      </span>
                      <span className="font-display font-semibold text-sm text-[#1C1C19] dark:text-white tabular-nums ml-2 shrink-0">
                        {formatBRL(d.value)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-[#EAE7E1] dark:bg-[#333] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%`, background: d.color }}
                      />
                    </div>
                    <div className="text-[10px] text-[#9A9892] dark:text-[#707070] mt-0.5">
                      {d.percent.toFixed(1)}% da renda · {barWidth.toFixed(1)}% das saídas
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
