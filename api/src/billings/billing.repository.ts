import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IBillingRepository } from './billings.service';

@Injectable()
export class BillingRepository implements IBillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getMonthFilter(userId: string, year: number, month: number) {
    return {
      userId,
      OR: [
        { recurring: false, year, month },
        {
          recurring: true,
          OR: [
            { startYear: { lt: year } },
            { startYear: year, startMonth: { lte: month } },
          ],
        },
      ],
    };
  }

  async insert(billing: any): Promise<void> {
    await this.prisma.billing.create({ data: billing });
  }

  async findById(userId: string, billingId: string): Promise<any> {
    return this.prisma.billing.findFirst({
      where: { id: billingId, userId },
    });
  }

  async listForMonth(userId: string, year: number, month: number): Promise<any[]> {
    return this.prisma.billing.findMany({
      where: this.getMonthFilter(userId, year, month),
    });
  }

  async updateFields(userId: string, billingId: string, fields: any): Promise<any> {
    // Verifica se existe antes de atualizar para respeitar o isolamento de tenant (userId)
    const exists = await this.findById(userId, billingId);
    if (!exists) return null;

    return this.prisma.billing.update({
      where: { id: billingId },
      data: fields,
    });
  }

  async delete(userId: string, billingId: string): Promise<void> {
    await this.prisma.billing.deleteMany({
      where: { id: billingId, userId },
    });
  }
}
