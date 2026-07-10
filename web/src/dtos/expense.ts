export type ExpenseStatus = "PENDING" | "PAID";

export interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon?: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  value: number | string;
  status: ExpenseStatus;
  color?: string;
  recurring?: boolean;
  endYear?: number | null;
  endMonth?: number | null;
}
