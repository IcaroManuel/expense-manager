export interface Billing {
  id: string;
  categoryId: string;
  value: number | string;
  description?: string;
  recurring?: boolean;
}
