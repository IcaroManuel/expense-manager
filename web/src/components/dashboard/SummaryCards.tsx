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
      className="relative bg-white border border-[#EAE7E1] rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-eyebrow">{label}</div>
          <div className="mt-3 font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            {value}
          </div>
          {sub ? <div className="mt-1 text-sm text-[#6B6A65]">{sub}</div> : null}
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: accent.bg, color: accent.fg }}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) return null;

  const balancePositive = summary.balance >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        sub={`${formatBRL(summary.totalPaid)} pagas · ${formatBRL(summary.totalPending)} pendentes`}
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
          balancePositive ? { bg: "#EDF2ED", fg: "#4A6B4A" } : { bg: "#F9EBEA", fg: "#B34A3E" }
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
