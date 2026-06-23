import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ITransactionRepository } from './investments.service';

@Injectable()
export class InvestmentTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(userId: string): Promise<any[]> {
    return this.prisma.investmentTransaction.findMany({ where: { userId } });
  }

  async insert(transaction: any): Promise<void> {
    await this.prisma.investmentTransaction.create({ data: transaction });
  }

  async findById(userId: string, id: string): Promise<any> {
    return this.prisma.investmentTransaction.findFirst({ where: { id, userId } });
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.prisma.investmentTransaction.deleteMany({ where: { id, userId } });
  }
}
