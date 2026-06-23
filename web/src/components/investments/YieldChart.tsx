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
import { formatBRL, monthYearLabel } from "@/lib/format";
import { INVESTMENTS } from "@/constants/test-ids";
import { MonthlyYield } from "@/dtos/investment";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { label: string } }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white border border-[#EAE7E1] rounded-xl px-3 py-2 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-[#6B6A65]">{p.payload.label}</div>
      <div className="font-display font-semibold text-[#1C1C19]">{formatBRL(p.value)}</div>
    </div>
  );
};

export default function YieldChart({ data }: { data: MonthlyYield[] }) {
  const chartData = data.map((d) => ({
    label: monthYearLabel(d.year, d.month),
    value: Number(d.yield),
    positive: Number(d.yield) >= 0,
  }));

  const isEmpty = chartData.length === 0;

  return (
    <div
      data-testid={INVESTMENTS.chart}
      className="bg-white border border-[#EAE7E1] rounded-2xl p-6 h-full flex flex-col"
    >
      <div className="mb-4">
        <div className="text-eyebrow">Histórico</div>
        <h2 className="font-display text-xl sm:text-2xl font-semibold mt-1 tracking-tight">
          Rendimento por mês
        </h2>
        <div className="text-sm text-[#6B6A65] mt-1">
          Quanto seu dinheiro rendeu, excluindo depósitos e retiradas.
        </div>
      </div>

      <div className="flex-1 min-h-[260px]">
        {isEmpty ? (
          <div className="h-full min-h-[260px] flex items-center justify-center text-sm text-[#9A9892]">
            Cadastre ao menos 2 atualizações de saldo para visualizar o rendimento mensal.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={260}>
            <BarChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
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
                tickFormatter={(v: number) => (v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`)}
              />
              <Tooltip cursor={{ fill: "#F3F1ED" }} content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.positive ? "#4A6B4A" : "#B34A3E"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
