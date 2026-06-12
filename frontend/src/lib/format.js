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
