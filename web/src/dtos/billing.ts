export type BillingType = "SALARY" | "AWARD";

export interface Billing {
  id: string;
  name: string;
  type: BillingType;
  value: number | string;
  recurring?: boolean;
}
