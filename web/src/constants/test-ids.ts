// data-testid registry
export const DASHBOARD = {
  root: "dashboard-root",
  monthPrev: "month-prev-btn",
  monthNext: "month-next-btn",
  monthLabel: "month-current-label",
  yearLabel: "year-current-label",
  addBilling: "add-billing-btn",
  addExpense: "add-expense-btn",
  summaryIncome: "summary-income",
  summaryExpense: "summary-expense",
  summaryBalance: "summary-balance",
  summaryCommitted: "summary-committed",
  billingList: "billing-list",
  billingItem: (id: string | number) => `billing-item-${id}`,
  billingDelete: (id: string | number) => `billing-delete-${id}`,
  billingDeleteAll: (id: string | number) => `billing-delete-all-${id}`,
  expenseList: "expense-list",
  expenseItem: (id: string | number) => `expense-item-${id}`,
  expenseDelete: (id: string | number) => `expense-delete-${id}`,
  expenseDeleteAll: (id: string | number) => `expense-delete-all-${id}`,
  expenseToggleStatus: (id: string | number) => `expense-toggle-status-${id}`,
  expenseEdit: (id: string | number) => `expense-edit-${id}`,
  chart: "spending-chart",
} as const;

export const MODAL = {
  billingDialog: "billing-modal",
  billingName: "billing-name-input",
  billingType: "billing-type-select",
  billingValue: "billing-value-input",
  billingSubmit: "billing-submit-btn",
  billingCancel: "billing-cancel-btn",
  expenseDialog: "expense-modal",
  expenseName: "expense-name-input",
  expenseType: "expense-type-select",
  expenseValue: "expense-value-input",
  expenseStatus: "expense-status-select",
  expenseSubmit: "expense-submit-btn",
  expenseCancel: "expense-cancel-btn",
} as const;

export const NAV = {
  dashboardLink: "nav-link-dashboard",
  investmentsLink: "nav-link-investments",
} as const;

export const INVESTMENTS = {
  root: "investments-root",
  pendingBanner: "investments-pending-banner",
  cardTotal: "investments-card-total",
  cardInvested: "investments-card-invested",
  cardYield: "investments-card-yield",
  addTransactionBtn: "investments-add-transaction-btn",
  updateBalanceBtn: "investments-update-balance-btn",
  transactionList: "investments-transaction-list",
  transactionDelete: (id: string) => `investments-transaction-delete-${id}`,
  chart: "investments-yield-chart",
} as const;

export const INVESTMENT_MODAL = {
  transactionDialog: "investment-transaction-modal",
  transactionType: "investment-transaction-type-select",
  transactionValue: "investment-transaction-value-input",
  transactionDate: "investment-transaction-date-input",
  transactionNote: "investment-transaction-note-input",
  transactionSubmit: "investment-transaction-submit-btn",
  transactionCancel: "investment-transaction-cancel-btn",
  balanceDialog: "investment-balance-modal",
  balanceValue: "investment-balance-value-input",
  balanceSubmit: "investment-balance-submit-btn",
  balanceCancel: "investment-balance-cancel-btn",
} as const;
