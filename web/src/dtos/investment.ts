export type TransactionType = "DEPOSIT" | "WITHDRAWAL";

export interface InvestmentTransaction {
  id: string;
  type: TransactionType;
  value: number | string;
  year: number;
  month: number;
  day: number;
  note?: string | null;
}

export interface InvestmentsSummary {
  currentTotal: number;
  totalInvested: number;
  totalYield: number;
  pendingSnapshot: boolean;
}

export interface MonthlyYield {
  year: number;
  month: number;
  yield: number;
}
