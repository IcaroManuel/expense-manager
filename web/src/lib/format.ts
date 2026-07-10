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

export const CATEGORY_TYPE_LABEL: Record<string, string> = {
  INCOME: "Entrada",
  EXPENSE: "Saída",
};

export const INCOME_TYPE_LABEL: Record<string, string> = {
  SALARY: "Salário",
  AWARD: "Prêmios",
  FOOD: "Alimentação",
  TRANSPORT: "Transporte",
  OTHER: "Outros",
};

export const EXPENSE_STATUS_LABEL: Record<string, string> = {
  PAID: "Paga",
  PENDING: "Pendente",
};

export const EXPENSE_COLOR_PALETTE = [
  { value: "#820AD1", label: "Roxo Vivido" },
  { value: "#FF7200", label: "Laranja Vivido" },
  { value: "#ec0000", label: "Vermelho Vivido" },
  { value: "#2D4238", label: "Verde escuro" },
  { value: "#4A6B4A", label: "Verde médio" },
  { value: "#8FBF8A", label: "Verde claro" },
  { value: "#3B82F6", label: "Azul" },
  { value: "#06B6D4", label: "Ciano" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#F59E0B", label: "Âmbar" },
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
