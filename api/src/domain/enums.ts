export enum BillingType {
  SALARY = 'SALARY',
  AWARD = 'AWARD',
}

export enum ExpenseType {
  FIXED = 'FIXED',
  CARD = 'CARD',
  DETACHED = 'DETACHED',
}

export enum ExpenseStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
}

// Conjuntos (Sets) para facilitar a validação de regras de negócio
export const RECURRING_BILLING_TYPES = new Set<string>([BillingType.SALARY]);
export const RECURRING_EXPENSE_TYPES = new Set<string>([
  ExpenseType.FIXED,
  ExpenseType.CARD,
]);
