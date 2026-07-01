export type ExpenseType = "FIXED" | "CARD" | "CARD_SINGLE" | "DETACHED";
export type ExpenseStatus = "PENDING" | "PAID";

export interface Expense {
  id: string;
  name: string;
  type: ExpenseType;
  value: number | string;
  status: ExpenseStatus;
  color?: string;
  recurring?: boolean;
  endYear?: number | null;
  endMonth?: number | null;
}
