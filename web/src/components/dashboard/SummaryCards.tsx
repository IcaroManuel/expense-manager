import React from "react";
import { ArrowDownRight, ArrowUpRight, Wallet, Percent, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DASHBOARD } from "@/constants/test-ids";
import { formatBRL } from "@/lib/format";
import { Summary } from "@/dtos/summary";

export interface SummaryCardsProps {
  summary?: Summary | null;
  previousSummary?: Summary | null;
}

interface TrendConfig {
  color: string;
  icon: React.ElementType;
  label: string;
}

// Cada campo tem sua própria lógica de "bom/ruim"
function getTrend(
  current: number,
  previous: number,
  mode: "higher-is-better" | "lower-is-better",
): TrendConfig | null {
  if (!previous || !current) return null;
  const diff = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(diff) < 0.5) {
    return { color: "#9A9892", icon: Minus, label: "Estável" };
  }
  const increased = diff > 0;
  const isGood =
    mode === "higher-is-better" ? increased : !increased;

  return {
    color: isGood ? "#5a8c5e" : "#d46560",
    icon: increased ? TrendingUp : TrendingDown,
    label: `${increased ? "+" : ""}${diff.toFixed(1)}% vs. mês ant.`,
  };
}

function TrendBadge({ trend }: { trend: TrendConfig }) {
  const Icon = trend.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold mt-1.5"
      style={{ color: trend.color }}
    >
      <Icon size={13} />
      {trend.label}
    </span>
  );
}

interface CardProps {
  label: string;
  value: string;
  sub?: string | null;
  accent: { bg: string; fg: string; darkBg: string; darkFg: string };
  icon: React.ElementType;
  testId?: string;
  trend?: TrendConfig | null;
}

function Card({ label, value, sub, accent, icon: Icon, testId, trend }: CardProps) {
  return (
    <div
      data-testid={testId}
      className="relative bg-white dark:bg-[#1a1a1a] border border-[#EAE7E1] dark:border-[#333] rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:shadow-xl overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-[#6B6A65] dark:text-[#a0a0a0] font-medium">
            {label}
          </div>
          <div className="mt-2 font-display text-lg sm:text-2xl font-semibold tracking-tight leading-tight break-all dark:text-white">
            {value}
          </div>
          {sub && (
            <div className="mt-1 text-xs text-[#6B6A65] dark:text-[#707070] leading-snug break-words">
              {sub}
            </div>
          )}
          {trend && <TrendBadge trend={trend} />}
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 dark:opacity-90"
          style={{
            background: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
              ? accent.darkBg
              : accent.bg,
            color: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
              ? accent.darkFg
              : accent.fg,
          }}
        >
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ summary, previousSummary }: SummaryCardsProps) {
  if (!summary) return null;

  const prev = previousSummary;
  const balancePositive = summary.balance >= 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
      <Card
        testId={DASHBOARD.summaryIncome}
        label="Total de entradas"
        value={formatBRL(summary.totalIncome)}
        // entradas: mais é melhor
        trend={prev ? getTrend(summary.totalIncome, prev.totalIncome, "higher-is-better") : null}
        icon={ArrowUpRight}
        accent={{ bg: "#EDF2ED", fg: "#4A6B4A", darkBg: "#1a3a1e", darkFg: "#5a8c5e" }}
      />
      <Card
        testId={DASHBOARD.summaryExpense}
        label="Total de saídas"
        value={formatBRL(summary.totalExpenses)}
        sub={`${formatBRL(summary.totalPaid)} pagas · ${formatBRL(summary.totalPending)} pend.`}
        // saídas: menos é melhor
        trend={prev ? getTrend(summary.totalExpenses, prev.totalExpenses, "lower-is-better") : null}
        icon={ArrowDownRight}
        accent={{ bg: "#F9EBEA", fg: "#B34A3E", darkBg: "#3a1f1c", darkFg: "#ff8a80" }}
      />
      <Card
        testId={DASHBOARD.summaryBalance}
        label="Saldo do mês"
        value={formatBRL(summary.balance)}
        sub={balancePositive ? "Sobra positiva" : "Atenção: déficit"}
        trend={prev ? getTrend(summary.balance, prev.balance, "higher-is-better") : null}
        icon={Wallet}
        accent={
          balancePositive
            ? { bg: "#EDF2ED", fg: "#4A6B4A", darkBg: "#1a3a1e", darkFg: "#5a8c5e" }
            : { bg: "#F9EBEA", fg: "#B34A3E", darkBg: "#3a1f1c", darkFg: "#ff8a80" }
        }
      />
      <Card
        testId={DASHBOARD.summaryCommitted}
        label="% comprometido"
        value={`${(summary.committedPercentage ?? 0).toFixed(1)}%`}
        sub="da sua renda do mês"
        icon={Percent}
        accent={{ bg: "#FDF6EA", fg: "#C68B35", darkBg: "#3a2f1a", darkFg: "#d9a043" }}
      />
    </div>
  );
}
