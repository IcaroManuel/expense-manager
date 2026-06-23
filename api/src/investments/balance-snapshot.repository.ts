import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ISnapshotRepository } from './investments.service';

@Injectable()
export class BalanceSnapshotRepository implements ISnapshotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(userId: string): Promise<any[]> {
    return this.prisma.balanceSnapshot.findMany({ where: { userId } });
  }

  async findByYearMonth(userId: string, year: number, month: number): Promise<any> {
    return this.prisma.balanceSnapshot.findUnique({
      where: { userId_year_month: { userId, year, month } },
    });
  }

  async insert(snapshot: any): Promise<any> {
    return this.prisma.balanceSnapshot.create({ data: snapshot });
  }
}
