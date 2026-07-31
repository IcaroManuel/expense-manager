import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { EventHub } from '../common/patterns/event-hub';
import {
  type IRecurrenceSkipRepository,
  SKIP_REPOSITORY,
} from '../billings/billings.service';

export interface ExpenseCreate {
  categoryId: string;
  status: string;
  color?: string;
  value: number;
  year: number;
  month: number;
  date?: string | null;
  endYear?: number | null;
  endMonth?: number | null;
}
export interface ExpenseUpdate {
  categoryId?: string;
  value?: number;
  status?: string;
  color?: string;
  date?: string | null;
  endYear?: number | null;
  endMonth?: number | null;
}

export const EXPENSE_REPOSITORY = 'EXPENSE_REPOSITORY';
export interface IExpenseRepository {
  listForMonth(userId: string, year: number, month: number): Promise<any[]>;
  insert(expense: any): Promise<void>;
  insertMany(expenses: any[]): Promise<void>;
  updateFields(userId: string, expenseId: string, fields: any): Promise<any>;
  findById(userId: string, expenseId: string): Promise<any>;
  delete(userId: string, expenseId: string): Promise<void>;
  deleteByGroup(userId: string, recurrenceGroupId: string): Promise<void>;
}

const PENDING_STATUS = 'PENDING';
const MAX_RECURRENCE_MONTHS = 360;

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(EXPENSE_REPOSITORY) private readonly repo: IExpenseRepository,
    @Inject(SKIP_REPOSITORY) private readonly skips: IRecurrenceSkipRepository,
    private readonly hub: EventHub,
  ) {}

  private nowIso(): string {
    return new Date().toISOString();
  }

  private materializeExpense(doc: any, year: number, month: number): any {
    return {
      id: doc.id,
      categoryId: doc.categoryId,
      value: doc.value,
      status: doc.status || PENDING_STATUS,
      color: doc.color || '#820AD1',
      date: doc.date ?? null,
      recurring: doc.recurring || false,
      recurrenceGroupId: doc.recurrenceGroupId ?? null,
      endYear: doc.endYear ?? null,
      endMonth: doc.endMonth ?? null,
      year,
      month,
      created_at: doc.created_at || this.nowIso(),
      updated_at: doc.updated_at || this.nowIso(),
    };
  }

  async listForMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<any[]> {
    const raw = await this.repo.listForMonth(userId, year, month);
    const skipped = await this.skips.listForMonth(
      userId,
      'expense',
      year,
      month,
    );

    const out = [];
    for (const d of raw) {
      if (d.recurring && skipped.includes(d.id)) {
        continue;
      }
      out.push(this.materializeExpense(d, year, month));
    }

    out.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return out;
  }

  async create(userId: string, payload: ExpenseCreate): Promise<any> {
    const isRecurring = payload.endYear != null && payload.endMonth != null;
    const now = new Date();
    const yearCreated = now.getFullYear();
    const monthCreated = now.getMonth() + 1;

    const date = payload.date ? new Date(payload.date) : null;
    const effectiveYear = date ? date.getUTCFullYear() : payload.year;
    const effectiveMonth = date ? date.getUTCMonth() + 1 : payload.month;

    const baseFields = {
      userId,
      categoryId: payload.categoryId,
      value: payload.value,
      status: payload.status,
      color: payload.color || '#820AD1',
      date,
      yearCreated,
      monthCreated,
    };

    if (!isRecurring) {
      const expense = {
        id: crypto.randomUUID(),
        ...baseFields,
        recurring: false,
        recurrenceGroupId: null,
        startYear: null,
        startMonth: null,
        endYear: null,
        endMonth: null,
        year: effectiveYear,
        month: effectiveMonth,
      };

      await this.repo.insert(expense);
      this.hub.publish({ name: 'expense.created', payload: expense });

      return this.materializeExpense(expense, effectiveYear, effectiveMonth);
    }

    const startIndex = effectiveYear * 12 + effectiveMonth;
    const endIndex = payload.endYear! * 12 + payload.endMonth!;
    if (endIndex < startIndex) {
      throw new BadRequestException(
        'A data de término não pode ser anterior ao mês inicial.',
      );
    }
    if (endIndex - startIndex + 1 > MAX_RECURRENCE_MONTHS) {
      throw new BadRequestException(
        'O período de recorrência é muito longo.',
      );
    }

    const recurrenceGroupId = crypto.randomUUID();
    const expenses: any[] = [];
    for (let idx = startIndex; idx <= endIndex; idx++) {
      const y = Math.floor((idx - 1) / 12);
      const m = idx - y * 12;
      expenses.push({
        id: crypto.randomUUID(),
        ...baseFields,
        recurring: true,
        recurrenceGroupId,
        startYear: effectiveYear,
        startMonth: effectiveMonth,
        endYear: payload.endYear,
        endMonth: payload.endMonth,
        year: y,
        month: m,
      });
    }

    await this.repo.insertMany(expenses);
    this.hub.publish({ name: 'expense.created', payload: expenses[0] });

    return this.materializeExpense(expenses[0], effectiveYear, effectiveMonth);
  }

  async update(
    userId: string,
    expenseId: string,
    payload: ExpenseUpdate,
    year: number,
    month: number,
  ): Promise<any | null> {
    const existing = await this.repo.findById(userId, expenseId);
    if (!existing) return null;

    if (existing.status === 'PAID') {
      throw new BadRequestException(
        'Não é possível editar uma despesa com status pago.',
      );
    }

    const fields: any = {};
    if (payload.categoryId !== undefined) fields.categoryId = payload.categoryId;
    if (payload.value !== undefined) fields.value = payload.value;
    if (payload.status !== undefined) fields.status = payload.status;
    if (payload.color !== undefined) fields.color = payload.color;
    if (payload.date !== undefined) fields.date = payload.date ? new Date(payload.date) : null;
    if (payload.endYear !== undefined) fields.endYear = payload.endYear;
    if (payload.endMonth !== undefined) fields.endMonth = payload.endMonth;

    const updated = await this.repo.updateFields(userId, expenseId, fields);
    if (!updated) return null;

    this.hub.publish({ name: 'expense.updated', payload: updated });
    return this.materializeExpense(updated, year, month);
  }

  async deleteForMonth(
    userId: string,
    expenseId: string,
    year: number,
    month: number,
  ): Promise<boolean> {
    const doc = await this.repo.findById(userId, expenseId);
    if (!doc) return false;

    if (doc.recurring && doc.year == null) {
      // Linha legada: um único registro cobrindo um intervalo de meses.
      await this.skips.addSkip(userId, 'expense', expenseId, year, month);
    } else {
      await this.repo.delete(userId, expenseId);
    }

    this.hub.publish({
      name: 'expense.deleted',
      payload: { id: expenseId, year, month },
    });
    return true;
  }

  async deleteTemplate(userId: string, expenseId: string): Promise<boolean> {
    const doc = await this.repo.findById(userId, expenseId);
    if (!doc) return false;

    if (doc.recurrenceGroupId) {
      await this.repo.deleteByGroup(userId, doc.recurrenceGroupId);
    } else {
      await this.repo.delete(userId, expenseId);
      await this.skips.deleteAllForEntity(userId, 'expense', expenseId);
    }

    this.hub.publish({
      name: 'expense.template_deleted',
      payload: { id: expenseId },
    });
    return true;
  }
}
