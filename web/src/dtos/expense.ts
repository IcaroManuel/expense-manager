export type ExpenseType = "FIXED" | "CARD" | "DETACHED";
export type ExpenseStatus = "PENDING" | "PAID";


export interface Expense {
  id: string;
  name: string;
  type: ExpenseType;
  value: number | string;
  status: ExpenseStatus;
  color?: string;
  recurring?: boolean;
}
