import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { EXPENSE_TYPE_LABEL, EXPENSE_TYPE_COLOR, formatBRL } from "@/lib/format";
import { DASHBOARD } from "@/constants/test-ids";
import { ExpenseType } from "@/dtos/expense";
import { Repeat, CreditCard, Banknote } from "lucide-react";

export interface ExpenseBucket {
  type: ExpenseType | string;
  value: number | string;
}

export interface SummaryData {
  totalIncome?: number | string;
  expensesByType?: ExpenseBucket[];
}

export interface SpendingChartProps {
  summary?: SummaryData | null;
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  FIXED:       { icon: Repeat,     color: "#2D4238", bg: "#EDF2ED" },
  CARD:        { icon: CreditCard, color: "#4A6B4A", bg: "#D6E8D6" },
  CARD_SINGLE: { icon: CreditCard, color: "#4A6B4A", bg: "#D6E8D6" },
  DETACHED:    { icon: Banknote,   color: "#C68B35", bg: "#FDF6EA" },
};

const ORDER: ExpenseType[] = ["FIXED", "CARD", "CARD_SINGLE", "DETACHED"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white border border-[#EAE7E1] rounded-xl px-3 py-2 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-[#6B6A65]">{p.name}</div>
      <div className="font-display font-semibold text-[#1C1C19]">{formatBRL(p.value)}</div>
      {p.payload.percent != null && (
        <div className="text-xs text-[#6B6A65] mt-0.5">{p.payload.percent.toFixed(1)}% da renda</div>
      )}
    </div>
  );
};

export default function SpendingChart({ summary }: SpendingChartProps) {
  if (!summary) return null;

  const income = Number(summary.totalIncome || 0);
  const buckets = summary.expensesByType || [];

  const data = ORDER
    .map((t) => {
      const found = buckets.find((b) => b.type === t);
      const value = found ? Number(found.value) : 0;
      return {
        type: t,
        name: EXPENSE_TYPE_LABEL[t] ?? t,
        value,
        percent: income > 0 ? (value / income) * 100 : 0,
        color: TYPE_META[t]?.color ?? "#9A9892",
        bg: TYPE_META[t]?.bg ?? "#F3F1ED",
        icon: TYPE_META[t]?.icon ?? Banknote,
      };
    })
    .filter((d) => d.value > 0);

  const allZero = data.length === 0;
  const totalExpenses = data.reduce((a, d) => a + d.value, 0);

  return (
    // ← removido h-full, agora segue o conteúdo
    <div
      data-testid={DASHBOARD.chart}
      className="bg-white border border-[#EAE7E1] rounded-2xl p-4 sm:p-6 flex flex-col"
    >
      <div className="mb-4">
        <div className="text-eyebrow">Análise</div>
        <h2 className="font-display text-xl sm:text-2xl font-semibold mt-1 tracking-tight">
          Gastos por categoria
        </h2>
        <div className="text-sm text-[#6B6A65] mt-1">
          Distribuição das saídas do mês.
        </div>
      </div>

      {allZero ? (
        <div className="flex items-center justify-center text-sm text-[#9A9892] py-16">
          Nenhuma despesa neste mês.
        </div>
      ) : (
        <>
          {/* Donut chart */}
          <div className="relative h-[180px] sm:h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={3}
                >
                  {data.map((entry) => (
                    <Cell key={entry.type} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Total no centro */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase tracking-widest text-[#9A9892]">Total</span>
              <span className="font-display font-bold text-base sm:text-lg text-[#1C1C19] tabular-nums">
                {formatBRL(totalExpenses)}
              </span>
            </div>
          </div>

          {/* Cards por categoria */}
          <div className="mt-4 space-y-2">
            {data.map((d) => {
              const Icon = d.icon;
              const barWidth = totalExpenses > 0 ? (d.value / totalExpenses) * 100 : 0;
              return (
                <div key={d.type} className="flex items-center gap-3 p-3 rounded-xl bg-[#F9F8F6] border border-[#EAE7E1]">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: d.bg, color: d.color }}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[#1C1C19] truncate">{d.name}</span>
                      <span className="font-display font-semibold text-sm text-[#1C1C19] tabular-nums ml-2 shrink-0">
                        {formatBRL(d.value)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-[#EAE7E1] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%`, background: d.color }}
                      />
                    </div>
                    <div className="text-[10px] text-[#9A9892] mt-0.5">
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
