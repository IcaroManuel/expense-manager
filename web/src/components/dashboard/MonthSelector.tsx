"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { MONTHS_PT } from "@/lib/format";
import { DASHBOARD } from "@/constants/test-ids";

export interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  loading?: boolean;
  firstYear?: number;
}

// Dropdown customizado padronizado com o design system
function Dropdown({
  value,
  label,
  options,
  onChange,
  disabled,
}: {
  value: string;
  label: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 font-display text-base font-semibold tracking-tight text-[#1C1C19] dark:text-white hover:text-[#2D4238] dark:hover:text-[#4a7c4e] transition-colors disabled:opacity-40 outline-none group"
      >
        <span>{label}</span>
        <ChevronDown
          size={14}
          className={`text-[#9A9892] dark:text-[#707070] group-hover:text-[#2D4238] dark:group-hover:text-[#4a7c4e] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-[#1a1a1a] border border-[#EAE7E1] dark:border-[#333] rounded-2xl shadow-lg dark:shadow-2xl overflow-hidden min-w-[140px]">
          <div className="max-h-[240px] overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  opt.value === value
                    ? "bg-[#2D4238] dark:bg-[#4a7c4e] text-white font-medium"
                    : "text-[#1C1C19] dark:text-white hover:bg-[#F3F1ED] dark:hover:bg-[#2a2a2a]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MonthSelector({
  year,
  month,
  onChange,
  loading = false,
  firstYear,
}: MonthSelectorProps) {
  const MIN_YEAR = firstYear ?? new Date().getFullYear();
  const MAX_YEAR = new Date().getFullYear() + 10;
  const years = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

  const monthOptions = MONTHS_PT.map((m, i) => ({ value: String(i + 1), label: m }));
  const yearOptions = years.map((y) => ({ value: String(y), label: String(y) }));

  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };

  const next = () => {
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          data-testid={DASHBOARD.monthPrev}
          onClick={prev}
          disabled={loading}
          className="w-9 h-9 rounded-full border border-[#EAE7E1] dark:border-[#333] flex items-center justify-center text-[#1C1C19] dark:text-white hover:bg-[#F3F1ED] dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Centro com os dois dropdowns */}
        <div className="flex flex-col items-center gap-0.5 min-w-[180px]">
          <div className="text-[10px] uppercase tracking-widest text-[#9A9892] dark:text-[#707070] font-medium">
            Mês de referência
          </div>
          <div className="flex items-center gap-2">
            <Dropdown
              value={String(month)}
              label={MONTHS_PT[month - 1]}
              options={monthOptions}
              onChange={(v) => onChange(year, Number(v))}
              disabled={loading}
            />
            <span className="text-[#D4D0C8] dark:text-[#444] font-light select-none">/</span>
            <Dropdown
              value={String(year)}
              label={String(year)}
              options={yearOptions}
              onChange={(v) => onChange(Number(v), month)}
              disabled={loading}
            />
          </div>
        </div>

        <button
          data-testid={DASHBOARD.monthNext}
          onClick={next}
          disabled={loading}
          className="w-9 h-9 rounded-full border border-[#EAE7E1] dark:border-[#333] flex items-center justify-center text-[#1C1C19] dark:text-white hover:bg-[#F3F1ED] dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
          aria-label="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-1.5 text-xs text-[#9A9892] dark:text-[#707070]">
          <Loader2 size={12} className="animate-spin" />
          Carregando...
        </div>
      )}
    </div>
  );
}
