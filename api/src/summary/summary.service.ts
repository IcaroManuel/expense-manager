import { Injectable } from '@nestjs/common';
import { BillingsService } from '../billings/billings.service';
import { ExpensesService } from '../expenses/expenses.service';
import {
  SumValueStrategy,
  FilteredSumStrategy,
  CommittedPercentageStrategy,
  GroupByTypeStrategy,
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
}

@Injectable()
export class SummaryService {
  private readonly sumStrategy = new SumValueStrategy();
  private readonly sumPaidStrategy = new FilteredSumStrategy('status', 'PAID');
  private readonly sumPendingStrategy = new FilteredSumStrategy(
    'status',
    'PENDING',
  );
  private readonly committedStrategy = new CommittedPercentageStrategy();
  private readonly groupByTypeStrategy = new GroupByTypeStrategy();

  constructor(
    private readonly billingsService: BillingsService,
    private readonly expensesService: ExpensesService,
  ) {}

  async forMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<MonthSummary> {
    const billings = await this.billingsService.listForMonth(
      userId,
      year,
      month,
    );
    const expenses = await this.expensesService.listForMonth(
      userId,
      year,
      month,
    );

    const totalIncome = this.sumStrategy.calculate(billings);
    const totalExpenses = this.sumStrategy.calculate(expenses);
    const totalPaid = this.sumPaidStrategy.calculate(expenses);
    const totalPending = this.sumPendingStrategy.calculate(expenses);
    const balance = Number((totalIncome - totalExpenses).toFixed(2));
    const committedPercentage = this.committedStrategy.calculate(
      totalIncome,
      totalExpenses,
    );

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
    };
  }
}
