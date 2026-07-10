import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async create(userId: string, payload: { name: string; type: 'INCOME' | 'EXPENSE'; icon?: string }) {
    if (!payload.name || !payload.type) {
      throw new BadRequestException('Nome e tipo são obrigatórios');
    }

    const existing = await this.prisma.category.findFirst({
      where: { userId, name: payload.name },
    });

    if (existing) {
      throw new BadRequestException('Categoria com este nome já existe');
    }

    return this.prisma.category.create({
      data: {
        name: payload.name.trim(),
        type: payload.type,
        icon: payload.icon || 'Tag',
        userId,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    payload: { name?: string; type?: 'INCOME' | 'EXPENSE' },
  ) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (payload.name) {
      const existing = await this.prisma.category.findFirst({
        where: { userId, name: payload.name, NOT: { id } },
      });

      if (existing) {
        throw new BadRequestException('Outra categoria com este nome já existe');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(payload.name && { name: payload.name.trim() }),
        ...(payload.type && { type: payload.type }),
      },
    });
  }

  async delete(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const expenseCount = await this.prisma.expense.count({
      where: { categoryId: id },
    });

    const billingCount = await this.prisma.billing.count({
      where: { categoryId: id },
    });

    if (expenseCount > 0 || billingCount > 0) {
      throw new BadRequestException(
        'Não é possível remover uma categoria que possui registros',
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
