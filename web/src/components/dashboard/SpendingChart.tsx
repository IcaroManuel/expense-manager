import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { EXPENSE_TYPE_LABEL, EXPENSE_TYPE_COLOR, formatBRL } from "@/lib/format";
import { DASHBOARD } from "@/constants/test-ids";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white border border-[#EAE7E1] rounded-xl px-3 py-2 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-[#6B6A65]">{p.payload.label}</div>
      <div className="font-display font-semibold text-[#1C1C19]">{formatBRL(p.value)}</div>
      {p.payload.percent != null && (
        <div className="text-xs text-[#6B6A65] mt-0.5">
          {p.payload.percent.toFixed(1)}% da renda
        </div>
      )}
    </div>
  );
};

export default function SpendingChart({ summary }) {
  if (!summary) return null;
  const income = Number(summary.totalIncome || 0);
  const buckets = summary.expensesByType  || [];
  const order = ["FIXED", "CARD", "DETACHED"];s
  const data = order.map((t) => {
    const found = buckets.find((b) => b.type === t);
    const value = found ? Number(found.value) : 0;
    return {
      type: t,
      label: EXPENSE_TYPE_LABEL[t],
      value,
      percent: income > 0 ? (value / income) * 100 : 0,
      color: EXPENSE_TYPE_COLOR[t],
    };
  });

  const allZero = data.every((d) => d.value === 0);

  return (
    <div
      data-testid={DASHBOARD.chart}
      className="bg-white border border-[#EAE7E1] rounded-2xl p-6 h-full flex flex-col"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-eyebrow">Análise</div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold mt-1 tracking-tight">
            Gastos por categoria
          </h2>
          <div className="text-sm text-[#6B6A65] mt-1">
            Distribuição absoluta e % comprometido da renda do mês.
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          {order.map((t) => (
            <div key={t} className="flex items-center gap-2 text-xs text-[#6B6A65]">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ background: EXPENSE_TYPE_COLOR[t] }}
              />
              {EXPENSE_TYPE_LABEL[t]}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[260px]">
        {allZero ? (
          <div className="h-full min-h-[260px] flex items-center justify-center text-sm text-[#9A9892]">
            Nenhuma despesa neste mês para visualizar.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={260}>
            <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E1" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6B6A65", fontSize: 12 }}
                axisLine={{ stroke: "#EAE7E1" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6B6A65", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`)}
              />
              <Tooltip cursor={{ fill: "#F3F1ED" }} content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={64}>
                {data.map((entry) => (
                  <Cell key={entry.type} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {data.map((d) => (
          <div key={d.type} className="rounded-xl bg-[#F9F8F6] border border-[#EAE7E1] px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-[#6B6A65]">{d.label}</div>
            <div className="font-display font-semibold text-[#1C1C19] mt-0.5 tabular-nums">
              {formatBRL(d.value)}
            </div>
            <div className="text-[11px] text-[#6B6A65]">{d.percent.toFixed(1)}% da renda</div>
          </div>
        ))}
      </div>
    </div>
  );
}
