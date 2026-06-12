import { BillingType, ExpenseStatus, ExpenseType } from './enums';

export interface BillingView {
  id: string;
  name: string;
  type: BillingType | string;
  value: number;
  recurring: boolean;
  year: number;
  month: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseView {
  id: string;
  name: string;
  type: ExpenseType | string;
  value: number;
  status: ExpenseStatus | string;
  color: string;
  recurring: boolean;
  year: number;
  month: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryBreakdown {
  type: string;
  value: number;
}
