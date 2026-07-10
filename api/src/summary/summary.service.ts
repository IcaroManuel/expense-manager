import { Injectable } from '@nestjs/common';
import { BillingsService } from '../billings/billings.service';
import { ExpensesService } from '../expenses/expenses.service';
import { CategoriesService } from '../categories/categories.service';
import {
  SumValueStrategy,
  FilteredSumStrategy,
  CommittedPercentageStrategy,
  GroupByTypeStrategy,
  GroupByCategoryStrategy,
} from '../common/patterns/strategies';

export interface MonthSummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  totalPaid: number;
  totalPending: number;
  balance: number;
  committedPercentage: number;
  expensesByType: any[];
  incomeByType: any[];
  expensesByCategory: any[];
}

export interface AnnualSummary {
  year: number;
  months: MonthSummary[];
  totals: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    bestMonth: number | null;   // mês com menor gasto
    worstMonth: number | null;  // mês com maior gasto
  };
  expensesByType: { type: string; value: number }[];
  expensesByCategory: { categoryId: string; categoryName: string; value: number; color: string }[];
  topExpenseMonth: number | null;
}

@Injectable()
export class SummaryService {
  private readonly sumStrategy = new SumValueStrategy();
  private readonly sumPaidStrategy = new FilteredSumStrategy('status', 'PAID');
  private readonly sumPendingStrategy = new FilteredSumStrategy('status', 'PENDING');
  private readonly committedStrategy = new CommittedPercentageStrategy();
  private readonly groupByTypeStrategy = new GroupByTypeStrategy();
  private readonly groupByCategoryStrategy = new GroupByCategoryStrategy();

  constructor(
    private readonly billingsService: BillingsService,
    private readonly expensesService: ExpensesService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async forMonth(userId: string, year: number, month: number): Promise<MonthSummary> {
    const [billings, expenses, categories] = await Promise.all([
      this.billingsService.listForMonth(userId, year, month),
      this.expensesService.listForMonth(userId, year, month),
      this.categoriesService.list(userId),
    ]);

    const totalIncome = this.sumStrategy.calculate(billings);
    const totalExpenses = this.sumStrategy.calculate(expenses);
    const totalPaid = this.sumPaidStrategy.calculate(expenses);
    const totalPending = this.sumPendingStrategy.calculate(expenses);
    const balance = Number((totalIncome - totalExpenses).toFixed(2));
    const committedPercentage = this.committedStrategy.calculate(totalIncome, totalExpenses);

    return {
      year,
      month,
      totalIncome,
      totalExpenses,
      totalPaid,
      totalPending,
      balance,
      committedPercentage,
      expensesByType: this.groupByTypeStrategy.calculate(expenses),
      incomeByType: this.groupByTypeStrategy.calculate(billings),
      expensesByCategory: this.groupByCategoryStrategy.calculate(expenses, categories),
    };
  }

  async forYear(userId: string, year: number): Promise<AnnualSummary> {
    const months = await Promise.all(
      Array.from({ length: 12 }, (_, i) => this.forMonth(userId, year, i + 1)),
    );

    const totalIncome = months.reduce((a, m) => a + m.totalIncome, 0);
    const totalExpenses = months.reduce((a, m) => a + m.totalExpenses, 0);
    const balance = Number((totalIncome - totalExpenses).toFixed(2));

    const activeMonths = months.filter((m) => m.totalExpenses > 0);

    const worstMonth = activeMonths.length
      ? activeMonths.reduce((a, b) => (b.totalExpenses > a.totalExpenses ? b : a)).month
      : null;

    const bestMonth = activeMonths.length
      ? activeMonths.reduce((a, b) => (b.totalExpenses < a.totalExpenses ? b : a)).month
      : null;

    const typeMap = new Map<string, number>();
    for (const m of months) {
      for (const bucket of m.expensesByType) {
        typeMap.set(bucket.type, (typeMap.get(bucket.type) ?? 0) + Number(bucket.value));
      }
    }
    const expensesByType = Array.from(typeMap.entries())
      .map(([type, value]) => ({ type, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);

    const categoryMap = new Map<string, { categoryName: string; value: number; color: string }>();
    for (const m of months) {
      for (const bucket of m.expensesByCategory) {
        const existing = categoryMap.get(bucket.categoryId);
        categoryMap.set(bucket.categoryId, {
          categoryName: bucket.categoryName,
          color: existing?.color ?? bucket.color,
          value: (existing?.value ?? 0) + Number(bucket.value),
        });
      }
    }
    const expensesByCategory = Array.from(categoryMap.entries())
      .map(([categoryId, v]) => ({
        categoryId,
        categoryName: v.categoryName,
        color: v.color,
        value: Number(v.value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);

    return {
      year,
      months,
      totals: { totalIncome, totalExpenses, balance, bestMonth, worstMonth },
      expensesByType,
      expensesByCategory,
      topExpenseMonth: worstMonth,
    };
  }
}
