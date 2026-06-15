import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS_PT } from "@/lib/format";
import { DASHBOARD } from "@/constants/test-ids";

export default function MonthSelector({ year, month, onChange }) {
  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };
  const next = () => {
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        data-testid={DASHBOARD.monthPrev}
        onClick={prev}
        className="w-9 h-9 rounded-full border border-[#EAE7E1] flex items-center justify-center text-[#1C1C19] hover:bg-[#F3F1ED] transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="text-center min-w-[160px]">
        <div className="text-eyebrow">Mês de referência</div>
        <div className="font-display text-lg font-semibold leading-tight tracking-tight">
          <span data-testid={DASHBOARD.monthLabel}>{MONTHS_PT[month - 1]}</span>
          <span className="text-[#9A9892] font-normal"> · </span>
          <span data-testid={DASHBOARD.yearLabel}>{year}</span>
        </div>
      </div>
      <button
        data-testid={DASHBOARD.monthNext}
        onClick={next}
        className="w-9 h-9 rounded-full border border-[#EAE7E1] flex items-center justify-center text-[#1C1C19] hover:bg-[#F3F1ED] transition-colors"
        aria-label="Próximo mês"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
