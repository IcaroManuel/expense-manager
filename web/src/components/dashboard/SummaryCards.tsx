import React from "react";
import { ArrowDownRight, ArrowUpRight, Wallet, Percent } from "lucide-react";
import { DASHBOARD } from "@/constants/test-ids";
import { formatBRL } from "@/lib/format";
import { Summary } from "@/dtos/summary";

export interface AccentColors {
  bg: string;
  fg: string;
}

export interface CardProps {
  label: string;
  value: string | React.ReactNode;
  sub?: string | null;
  accent: AccentColors;
  icon: React.ElementType;
  testId?: string;
}

export interface SummaryCardsProps {
  summary?: Summary | null;
}

function Card({ label, value, sub, accent, icon: Icon, testId }: CardProps) {
  return (
    <div
      data-testid={testId}
      className="relative bg-white border border-[#EAE7E1] rounded-2xl p-3 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[#6B6A65] font-medium truncate">
            {label}
          </div>
          <div className="mt-1.5 sm:mt-2 font-display text-base sm:text-xl font-semibold tracking-tight leading-tight break-all">
            {value}
          </div>
          {sub ? (
            <div className="mt-1 text-[10px] sm:text-xs text-[#6B6A65] leading-snug break-words">
              {sub}
            </div>
          ) : null}
        </div>
        <div
          className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: accent.bg, color: accent.fg }}
        >
          <Icon size={14} className="sm:hidden" />
          <Icon size={16} className="hidden sm:block" />
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) return null;

  const balancePositive = summary.balance >= 0;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-4 sm:mt-6">
      <Card
        testId={DASHBOARD.summaryIncome}
        label="Total de entradas"
        value={formatBRL(summary.totalIncome)}
        icon={ArrowUpRight}
        accent={{ bg: "#EDF2ED", fg: "#4A6B4A" }}
      />
      <Card
        testId={DASHBOARD.summaryExpense}
        label="Total de saídas"
        value={formatBRL(summary.totalExpenses)}
        sub={`${formatBRL(summary.totalPaid)} pagas · ${formatBRL(summary.totalPending)} pend.`}
        icon={ArrowDownRight}
        accent={{ bg: "#F9EBEA", fg: "#B34A3E" }}
      />
      <Card
        testId={DASHBOARD.summaryBalance}
        label="Saldo do mês"
        value={formatBRL(summary.balance)}
        sub={balancePositive ? "Sobra positiva" : "Atenção: déficit"}
        icon={Wallet}
        accent={
          balancePositive
            ? { bg: "#EDF2ED", fg: "#4A6B4A" }
            : { bg: "#F9EBEA", fg: "#B34A3E" }
        }
      />
      <Card
        testId={DASHBOARD.summaryCommitted}
        label="% comprometido"
        value={`${summary.committedPercentage.toFixed(1)}%`}
        sub="da sua renda do mês"
        icon={Percent}
        accent={{ bg: "#FDF6EA", fg: "#C68B35" }}
      />
    </div>
  );
}
