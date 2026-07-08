"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingDown, TrendingUp, Award, AlertTriangle, Loader2 } from "lucide-react";
import { fetchAnnualSummary } from "@/lib/api";
import {
  formatBRL, MONTH_SHORT_PT, MONTHS_PT, EXPENSE_TYPE_LABEL,
  EXPENSE_TYPE_COLOR,
} from "@/lib/format";

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#EAE7E1] rounded-xl px-3 py-2 shadow-sm text-sm">
      <div className="font-medium text-[#1C1C19] mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#6B6A65]">{p.name}:</span>
          <span className="font-semibold tabular-nums">{formatBRL(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAnnualSummary(year)
      .then(setData)
      .finally(() => setLoading(false));
  }, [year]);

  const chartData = data?.months?.map((m: any) => ({
    name: MONTH_SHORT_PT[m.month - 1],
    Saídas: m.totalExpenses,
    Saldo: m.balance,
  })) ?? [];

  const hasData = chartData.some((d: any) => d.Saídas > 0);

  const worstMonth = data?.totals?.worstMonth;
  const worstMonthLabel = worstMonth ? MONTHS_PT[worstMonth - 1] : "—";
  const worstMonthValue = worstMonth
    ? data.months.find((m: any) => m.month === worstMonth)?.totalExpenses ?? 0
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#9A9892] font-medium">Análise</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1">
            Visão anual
          </h1>
          <p className="text-[#6B6A65] text-sm mt-1">
            Seus dados financeiros do ano completo, mês a mês.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[#EAE7E1] rounded-2xl px-4 py-2.5 self-start">
          <span className="text-sm text-[#6B6A65]">Ano:</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="font-display font-semibold text-sm bg-transparent outline-none cursor-pointer text-[#1C1C19]"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 text-[#9A9892] gap-2">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Carregando dados do ano...</span>
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center py-32 text-[#9A9892] text-sm">
          Nenhum dado encontrado para {year}.
        </div>
      ) : (
        <>
          {/* Cards de destaque */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: "Total de entradas",
                value: formatBRL(data.totals.totalIncome),
                icon: TrendingUp,
                accent: { bg: "#EDF2ED", fg: "#4A6B4A" },
              },
              {
                label: "Total de saídas",
                value: formatBRL(data.totals.totalExpenses),
                icon: TrendingDown,
                accent: { bg: "#F9EBEA", fg: "#B34A3E" },
              },
              {
                label: "Saldo do ano",
                value: formatBRL(data.totals.balance),
                icon: data.totals.balance >= 0 ? Award : AlertTriangle,
                accent: data.totals.balance >= 0
                  ? { bg: "#EDF2ED", fg: "#4A6B4A" }
                  : { bg: "#F9EBEA", fg: "#B34A3E" },
              },
              {
                label: "Mês mais caro",
                value: (
                  <span>
                    {worstMonthLabel}
                    <span className="block text-sm font-normal text-[#6B6A65] mt-0.5">
                      {formatBRL(worstMonthValue)}
                    </span>
                  </span>
                ),
                icon: AlertTriangle,
                accent: { bg: "#FDF6EA", fg: "#C68B35" },
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white border border-[#EAE7E1] rounded-2xl p-3 sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-[#6B6A65] font-medium">
                      {card.label}
                    </div>
                    <div className="mt-2 font-display text-base sm:text-xl font-semibold tracking-tight break-all">
                      {card.value}
                    </div>
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: card.accent.bg, color: card.accent.fg }}
                  >
                    <card.icon size={15} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gráfico unificado — Gastos × Saldo */}
          <div className="bg-white border border-[#EAE7E1] rounded-2xl p-4 sm:p-6">
            <div className="mb-6">
              <div className="text-eyebrow">Evolução</div>
              <h2 className="font-display text-xl font-semibold tracking-tight mt-1">
                Gastos × Saldo mês a mês
              </h2>
            </div>
            <div className="h-[260px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E1" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#6B6A65" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9A9892" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    width={36}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Saídas"
                    stroke="#B34A3E"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#B34A3E", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Saldo"
                    stroke="#4A6B4A"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#4A6B4A", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* O que mais pesou no ano */}
          <div className="bg-white border border-[#EAE7E1] rounded-2xl p-4 sm:p-6">
            <div className="mb-6">
              <div className="text-eyebrow">Composição</div>
              <h2 className="font-display text-xl font-semibold tracking-tight mt-1">
                O que mais pesou no ano
              </h2>
            </div>
            <div className="space-y-3">
              {data.expensesByType.map((bucket: any) => {
                const total = data.totals.totalExpenses;
                const pct = total > 0 ? (bucket.value / total) * 100 : 0;
                const color = EXPENSE_TYPE_COLOR[bucket.type] ?? "#9A9892";
                return (
                  <div key={bucket.type} className="flex items-center gap-4">
                    <div className="w-28 sm:w-36 text-xs sm:text-sm font-medium text-[#1C1C19] shrink-0">
                      {EXPENSE_TYPE_LABEL[bucket.type] ?? bucket.type}
                    </div>
                    <div className="flex-1 h-2.5 rounded-full bg-[#EAE7E1] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <div className="text-xs sm:text-sm tabular-nums font-semibold text-[#1C1C19] w-24 sm:w-28 text-right shrink-0">
                      {formatBRL(bucket.value)}
                    </div>
                    <div className="text-xs text-[#9A9892] w-10 text-right shrink-0">
                      {pct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
