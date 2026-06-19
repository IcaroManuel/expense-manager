import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IExpenseRepository } from './expenses.service';

@Injectable()
export class ExpenseRepository implements IExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getMonthFilter(userId: string, year: number, month: number) {
    return {
      userId,
      OR: [
        { recurring: false, year, month },
        {
          recurring: true,
          AND: [
            {
              OR: [
                { startYear: { lt: year } },
                { startYear: year, startMonth: { lte: month } },
              ],
            },
            {
              OR: [
                { endYear: null },
                { endYear: { gt: year } },
                { endYear: year, endMonth: { gte: month } },
              ],
            },
          ],
        },
      ],
    };
  }

  async insert(expense: any): Promise<void> {
    await this.prisma.expense.create({ data: expense });
  }

  async findById(userId: string, expenseId: string): Promise<any> {
    return this.prisma.expense.findFirst({
      where: { id: expenseId, userId },
    });
  }

  async listForMonth(userId: string, year: number, month: number): Promise<any[]> {
    return this.prisma.expense.findMany({
      where: this.getMonthFilter(userId, year, month),
    });
  }

  async updateFields(userId: string, expenseId: string, fields: any): Promise<any> {
    const exists = await this.findById(userId, expenseId);
    if (!exists) return null;

    return this.prisma.expense.update({
      where: { id: expenseId },
      data: fields,
    });
  }

  async delete(userId: string, expenseId: string): Promise<void> {
    await this.prisma.expense.deleteMany({
      where: { id: expenseId, userId },
    });
  }
}
