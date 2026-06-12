export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export const formatBRL = (value) => BRL.format(Number(value || 0));

export const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const MONTH_SHORT_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export const BILLING_TYPE_LABEL = {
  SALARY: "Salário",
  AWARD: "Prêmio",
};

export const EXPENSE_TYPE_LABEL = {
  FIXED: "Fixa",
  CARD: "Cartão",
  DETACHED: "Avulsa",
};

export const EXPENSE_STATUS_LABEL = {
  PAID: "Paga",
  PENDING: "Pendente",
};

export const EXPENSE_TYPE_COLOR = {
  FIXED: "#2D4238",
  CARD: "#4A6B4A",
  DETACHED: "#C68B35",
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
];
