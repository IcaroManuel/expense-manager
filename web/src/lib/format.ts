export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export const formatBRL = (value: number | string | null | undefined): string =>
  BRL.format(Number(value || 0));

export const MONTHS_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
] as const;

export const MONTH_SHORT_PT = [
  "Jan","Fev","Mar","Abr","Mai","Jun",
  "Jul","Ago","Set","Out","Nov","Dez",
] as const;

export const BILLING_TYPE_LABEL: Record<string, string> = {
  SALARY: "Salário",
  AWARD: "Prêmio",
};

export const EXPENSE_TYPE_LABEL: Record<string, string> = {
  FIXED: "Fixa",
  CARD: "Cartão (recorrente)",
  CARD_SINGLE: "Cartão",
  DETACHED: "Avulsa",
};

export const EXPENSE_STATUS_LABEL: Record<string, string> = {
  PAID: "Paga",
  PENDING: "Pendente",
};

export const EXPENSE_TYPE_COLOR: Record<string, string> = {
  FIXED: "#2D4238",
  CARD: "#4A6B4A",
  CARD_SINGLE: "#4A6B4A",
  DETACHED: "#C68B35",
};

// Ordem de exibição: FIXED → CARD → CARD_SINGLE → DETACHED (item 6)
export const EXPENSE_TYPE_ORDER: Record<string, number> = {
  FIXED: 0,
  CARD: 1,
  CARD_SINGLE: 2,
  DETACHED: 3,
};

export const EXPENSE_COLOR_PALETTE = [
  { value: "#2D4238", label: "Verde escuro" },
  { value: "#4A6B4A", label: "Verde médio" },
  { value: "#8FBF8A", label: "Verde claro" },
  { value: "#3B82F6", label: "Azul" },
  { value: "#06B6D4", label: "Ciano" },
  { value: "#8B5CF6", label: "Roxo" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#F59E0B", label: "Âmbar" },
  { value: "#C68B35", label: "Caramelo" },
  { value: "#B34A3E", label: "Vermelho" },
  { value: "#0F172A", label: "Carvão" },
  { value: "#9A9892", label: "Cinza" },
] as const;

export const monthYearLabel = (year: number, month: number): string =>
  `${MONTH_SHORT_PT[month - 1]}/${year}`;

export function parseBRLInput(input: string): number {
  const trimmed = input.trim();
  if (trimmed.includes(",") && trimmed.includes(".")) {
    return parseFloat(trimmed.replace(/\./g, "").replace(",", "."));
  }
  if (trimmed.includes(",")) {
    return parseFloat(trimmed.replace(",", "."));
  }
  return parseFloat(trimmed);
}
