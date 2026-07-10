import { ExpenseStatus } from './enums';

export interface BillingView {
  id: string;
  categoryId: string;
  categoryName: string;
  value: number;
  description?: string;
  recurring: boolean;
  year: number;
  month: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseView {
  id: string;
  categoryId: string;
  categoryName: string;
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
  categoryId: string;
  categoryName: string;
  value: number;
  color: string;
}
