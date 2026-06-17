import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IRecurrenceSkipRepository } from '../../billings/billings.service';

@Injectable()
export class RecurrenceSkipRepository implements IRecurrenceSkipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addSkip(userId: string, entityKind: string, entityId: string, year: number, month: number): Promise<void> {
    await this.prisma.recurrenceSkip.upsert({
      where: {
        userId_entityKind_entityId_year_month: {
          userId,
          entityKind,
          entityId,
          year,
          month,
        },
      },
      update: {},
      create: {
        userId,
        entityKind,
        entityId,
        year,
        month,
      },
    });
  }

  async removeSkip(userId: string, entityKind: string, entityId: string, year: number, month: number): Promise<void> {
    await this.prisma.recurrenceSkip.deleteMany({
      where: { userId, entityKind, entityId, year, month },
    });
  }

  async listForMonth(userId: string, entityKind: string, year: number, month: number): Promise<string[]> {
    const skips = await this.prisma.recurrenceSkip.findMany({
      where: { userId, entityKind, year, month },
      select: { entityId: true },
    });
    return skips.map((skip: { entityId: string }) => skip.entityId);
  }

  async deleteAllForEntity(userId: string, entityKind: string, entityId: string): Promise<void> {
    await this.prisma.recurrenceSkip.deleteMany({
      where: { userId, entityKind, entityId },
    });
  }
}
