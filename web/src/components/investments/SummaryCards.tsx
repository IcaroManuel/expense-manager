import React from "react";
import { Landmark, TrendingUp, PiggyBank } from "lucide-react";
import { INVESTMENTS } from "@/constants/test-ids";
import { formatBRL } from "@/lib/format";
import { InvestmentsSummary } from "@/dtos/investment";

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  accent: { bg: string; fg: string };
  icon: React.ElementType;
  testId: string;
}

function Card({ label, value, sub, accent, icon: Icon, testId }: CardProps) {
  return (
    <div
      data-testid={testId}
      className="bg-white border border-[#EAE7E1] rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
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

export default function SummaryCards({ summary }: { summary: InvestmentsSummary | null }) {
  if (!summary) return null;

  const yieldPositive = summary.totalYield >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        testId={INVESTMENTS.cardTotal}
        label="Saldo total no banco"
        value={formatBRL(summary.currentTotal)}
        icon={Landmark}
        accent={{ bg: "#EDF2ED", fg: "#4A6B4A" }}
      />
      <Card
        testId={INVESTMENTS.cardInvested}
        label="Total investido"
        value={formatBRL(summary.totalInvested)}
        sub="Depósitos − retiradas"
        icon={PiggyBank}
        accent={{ bg: "#FDF6EA", fg: "#C68B35" }}
      />
      <Card
        testId={INVESTMENTS.cardYield}
        label="Rendimento"
        value={formatBRL(summary.totalYield)}
        sub={yieldPositive ? "Ganho acumulado" : "Perda acumulada"}
        icon={TrendingUp}
        accent={
          yieldPositive
            ? { bg: "#EDF2ED", fg: "#4A6B4A" }
            : { bg: "#F9EBEA", fg: "#B34A3E" }
        }
      />
    </div>
  );
}
